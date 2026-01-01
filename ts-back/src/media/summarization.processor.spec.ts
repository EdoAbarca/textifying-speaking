import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { SummarizationProcessor } from './summarization.processor';
import { MediaGateway } from './media.gateway';
import { MediaFile } from './schemas/media-file.schema';
import axios from 'axios';
import { Job } from 'bullmq';

jest.mock('axios');

describe('SummarizationProcessor', () => {
  let processor: SummarizationProcessor;
  let mediaGateway: MediaGateway;
  let configService: ConfigService;
  let mediaFileModel: any;

  const mockMediaFileModel = {
    findById: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  };

  const mockMediaGateway = {
    emitSummaryStatusUpdate: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      if (key === 'SUMMARIZATION_SERVICE_URL') {
        return 'http://summarization:5001';
      }
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SummarizationProcessor,
        { provide: getModelToken(MediaFile.name), useValue: mockMediaFileModel },
        { provide: MediaGateway, useValue: mockMediaGateway },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    processor = module.get<SummarizationProcessor>(SummarizationProcessor);
    mediaGateway = module.get<MediaGateway>(MediaGateway);
    configService = module.get<ConfigService>(ConfigService);
    mediaFileModel = mockMediaFileModel;
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    it('should successfully process summarization job', async () => {
      const jobData = {
        fileId: 'file123',
        userId: 'user123',
      };

      const mockJob = {
        data: jobData,
      } as unknown as Job;

      const mockFile = {
        _id: 'file123',
        originalFilename: 'test.mp3',
        transcribedText: 'This is a long transcribed text that needs to be summarized.',
      };

      const mockUpdatedFile = {
        ...mockFile,
        summaryStatus: 'completed',
        summaryText: 'This is a summary.',
      };

      mockMediaFileModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockFile),
      });

      mockMediaFileModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockUpdatedFile),
      });

      (axios.post as jest.Mock).mockResolvedValue({
        data: {
          success: true,
          summary: 'This is a summary.',
        },
      });

      await processor.process(mockJob);

      // Verify that findById was called
      expect(mockMediaFileModel.findById).toHaveBeenCalledWith('file123');

      // Verify that axios.post was called with correct parameters
      expect(axios.post).toHaveBeenCalledWith(
        'http://summarization:5001/summarize',
        {
          text: 'This is a long transcribed text that needs to be summarized.',
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 300000,
        },
      );

      // Verify that file was updated with summary
      expect(mockMediaFileModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'file123',
        {
          summaryStatus: 'completed',
          summaryText: 'This is a summary.',
        },
        { new: true },
      );

      // Verify WebSocket event was emitted
      expect(mockMediaGateway.emitSummaryStatusUpdate).toHaveBeenCalledWith('user123', {
        fileId: 'file123',
        summaryStatus: 'completed',
        summaryText: 'This is a summary.',
        originalFilename: 'test.mp3',
      });
    });

    it('should handle file not found error', async () => {
      const jobData = {
        fileId: 'file123',
        userId: 'user123',
      };

      const mockJob = {
        data: jobData,
      } as unknown as Job;

      mockMediaFileModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(processor.process(mockJob)).rejects.toThrow('File not found');

      // Verify that axios was not called
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('should handle missing transcribed text error', async () => {
      const jobData = {
        fileId: 'file123',
        userId: 'user123',
      };

      const mockJob = {
        data: jobData,
      } as unknown as Job;

      const mockFile = {
        _id: 'file123',
        originalFilename: 'test.mp3',
        transcribedText: null,
      };

      mockMediaFileModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockFile),
      });

      await expect(processor.process(mockJob)).rejects.toThrow('No transcribed text available');

      // Verify that axios was not called
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('should handle summarization service error', async () => {
      const jobData = {
        fileId: 'file123',
        userId: 'user123',
      };

      const mockJob = {
        data: jobData,
      } as unknown as Job;

      const mockFile = {
        _id: 'file123',
        originalFilename: 'test.mp3',
        transcribedText: 'This is a transcribed text.',
      };

      mockMediaFileModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockFile),
      });

      mockMediaFileModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockFile,
          summaryStatus: 'processing',
        }),
      });

      (axios.post as jest.Mock).mockRejectedValue(new Error('Service unavailable'));

      await expect(processor.process(mockJob)).rejects.toThrow('Service unavailable');

      // Verify that error status was updated
      expect(mockMediaFileModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'file123',
        {
          summaryStatus: 'error',
          summaryErrorMessage: 'Service unavailable',
        },
        { new: true },
      );

      // Verify error WebSocket event was emitted
      expect(mockMediaGateway.emitSummaryStatusUpdate).toHaveBeenCalledWith('user123', {
        fileId: 'file123',
        summaryStatus: 'error',
        summaryErrorMessage: 'Service unavailable',
      });
    });

    it('should handle API error response', async () => {
      const jobData = {
        fileId: 'file123',
        userId: 'user123',
      };

      const mockJob = {
        data: jobData,
      } as unknown as Job;

      const mockFile = {
        _id: 'file123',
        originalFilename: 'test.mp3',
        transcribedText: 'This is a transcribed text.',
      };

      mockMediaFileModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockFile),
      });

      mockMediaFileModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          ...mockFile,
          summaryStatus: 'processing',
        }),
      });

      (axios.post as jest.Mock).mockResolvedValue({
        data: {
          success: false,
          error: 'Text too short for summarization',
        },
      });

      await expect(processor.process(mockJob)).rejects.toThrow('Text too short for summarization');

      // Verify that error status was updated
      expect(mockMediaFileModel.findByIdAndUpdate).toHaveBeenCalledWith(
        'file123',
        {
          summaryStatus: 'error',
          summaryErrorMessage: 'Text too short for summarization',
        },
        { new: true },
      );
    });
  });
});
