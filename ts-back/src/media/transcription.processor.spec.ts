import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { TranscriptionProcessor } from './transcription.processor';
import { MediaService } from './media.service';
import { MediaGateway } from './media.gateway';
import axios from 'axios';
import * as fsSync from 'fs';
import { Job } from 'bullmq';
import { Readable } from 'stream';

jest.mock('axios');
jest.mock('fs');

describe('TranscriptionProcessor', () => {
  let processor: TranscriptionProcessor;
  let mediaService: MediaService;
  let mediaGateway: MediaGateway;
  let configService: ConfigService;

  const mockMediaService = {
    updateFileStatus: jest.fn(),
    updateFileProgress: jest.fn(),
    findById: jest.fn(),
  };

  const mockMediaGateway = {
    emitFileStatusUpdate: jest.fn(),
    emitFileProgress: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: any) => {
      if (key === 'TRANSCRIPTION_SERVICE_URL') {
        return 'http://transcription:5000';
      }
      return defaultValue;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TranscriptionProcessor,
        { provide: MediaService, useValue: mockMediaService },
        { provide: MediaGateway, useValue: mockMediaGateway },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    processor = module.get<TranscriptionProcessor>(TranscriptionProcessor);
    mediaService = module.get<MediaService>(MediaService);
    mediaGateway = module.get<MediaGateway>(MediaGateway);
    configService = module.get<ConfigService>(ConfigService);
  });

  // Helper function to create a proper stream mock
  const createMockStream = () => {
    const mockStream = {
      pipe: jest.fn(),
      on: jest.fn((event, callback) => {
        if (event === 'end') setTimeout(callback, 0);
        return mockStream;
      }),
      pause: jest.fn(),
      resume: jest.fn(),
      read: jest.fn(),
      emit: jest.fn(),
      removeListener: jest.fn(),
    };
    return mockStream;
  };

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  describe('process', () => {
    it('should successfully process transcription job', async () => {
      const jobData = {
        fileId: 'file123',
        userId: 'user123',
        filePath: '/uploads/test.mp3',
        originalFilename: 'test.mp3',
      };

      const mockJob = {
        data: jobData,
        updateProgress: jest.fn(),
      } as unknown as Job;

      const mockFile = {
        _id: 'file123',
        transcribedText: '',
        save: jest.fn(),
      };

      mockMediaService.findById.mockResolvedValue(mockFile);
      mockMediaService.updateFileStatus.mockResolvedValue(mockFile);
      mockMediaService.updateFileProgress.mockResolvedValue(mockFile);

      // Create a proper readable stream mock
      const mockStream = new Readable();
      mockStream.push('mock file content');
      mockStream.push(null);
      (fsSync.createReadStream as jest.Mock).mockReturnValue(mockStream);

      (axios.post as jest.Mock).mockResolvedValue({
        data: {
          success: true,
          text: 'Transcribed text here',
        },
      });

      const result = await processor.process(mockJob);

      expect(result.success).toBe(true);
      expect(result.fileId).toBe('file123');
      expect(result.text).toBe('Transcribed text here');

      expect(mockMediaService.updateFileStatus).toHaveBeenCalledWith('file123', 'processing', 5);
      expect(mockMediaService.updateFileStatus).toHaveBeenCalledWith('file123', 'completed', 100);
      expect(mockMediaGateway.emitFileStatusUpdate).toHaveBeenCalledWith('user123', 'file123', 'processing', 5);
      expect(mockMediaGateway.emitFileStatusUpdate).toHaveBeenCalledWith('user123', 'file123', 'completed', 100);
      
      expect(mockJob.updateProgress).toHaveBeenCalledWith(5);
      expect(mockJob.updateProgress).toHaveBeenCalledWith(10);
      expect(mockJob.updateProgress).toHaveBeenCalledWith(15);
      expect(mockJob.updateProgress).toHaveBeenCalledWith(20);
      expect(mockJob.updateProgress).toHaveBeenCalledWith(25);
      expect(mockJob.updateProgress).toHaveBeenCalledWith(90);
      expect(mockJob.updateProgress).toHaveBeenCalledWith(95);
      expect(mockJob.updateProgress).toHaveBeenCalledWith(100);
    });

    it('should handle transcription service error', async () => {
      const jobData = {
        fileId: 'file123',
        userId: 'user123',
        filePath: '/uploads/test.mp3',
        originalFilename: 'test.mp3',
      };

      const mockJob = {
        data: jobData,
        updateProgress: jest.fn(),
      } as unknown as Job;

      const mockFile = {
        _id: 'file123',
        transcribedText: '',
        save: jest.fn(),
      };

      mockMediaService.findById.mockResolvedValue(mockFile);
      mockMediaService.updateFileStatus.mockResolvedValue(mockFile);
      mockMediaService.updateFileProgress.mockResolvedValue(mockFile);

      (fsSync.createReadStream as jest.Mock).mockReturnValue(createMockStream());

      (axios.post as jest.Mock).mockRejectedValue(new Error('Network error'));

      await expect(processor.process(mockJob)).rejects.toThrow();

      expect(mockMediaService.updateFileStatus).toHaveBeenCalledWith(
        'file123',
        'error',
        0,
        'Network error',
      );
      expect(mockMediaGateway.emitFileStatusUpdate).toHaveBeenCalledWith(
        'user123',
        'file123',
        'error',
        0,
        'Network error',
      );
    });

    it('should handle transcription service returning error response', async () => {
      const jobData = {
        fileId: 'file123',
        userId: 'user123',
        filePath: '/uploads/test.mp3',
        originalFilename: 'test.mp3',
      };

      const mockJob = {
        data: jobData,
        updateProgress: jest.fn(),
      } as unknown as Job;

      const mockFile = {
        _id: 'file123',
        transcribedText: '',
        save: jest.fn(),
      };

      mockMediaService.findById.mockResolvedValue(mockFile);
      mockMediaService.updateFileStatus.mockResolvedValue(mockFile);
      mockMediaService.updateFileProgress.mockResolvedValue(mockFile);

      (fsSync.createReadStream as jest.Mock).mockReturnValue(createMockStream());

      (axios.post as jest.Mock).mockResolvedValue({
        data: {
          success: false,
          error: 'Invalid audio format',
        },
      });

      await expect(processor.process(mockJob)).rejects.toThrow('Invalid audio format');

      expect(mockMediaService.updateFileStatus).toHaveBeenCalledWith(
        'file123',
        'error',
        0,
        'Invalid audio format',
      );
    });
  });
});
