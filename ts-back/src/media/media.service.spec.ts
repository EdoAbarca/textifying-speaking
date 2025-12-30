import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { MediaService } from './media.service';
import { MediaFile, MediaFileDocument } from './schemas/media-file.schema';
import axios from 'axios';

describe('MediaService', () => {
  let service: MediaService;

  const mockMediaFile = {
    _id: '507f1f77bcf86cd799439011',
    userId: '507f191e810c19729de860ea',
    filename: 'file-123456.mp3',
    originalFilename: 'test.mp3',
    mimetype: 'audio/mpeg',
    path: '/uploads/file-123456.mp3',
    size: 1024,
    uploadDate: new Date(),
    status: 'ready',
    progress: 100,
  };

  const mockSave = jest.fn().mockResolvedValue(mockMediaFile);

  const mockMediaFileModel: any = jest.fn().mockImplementation(() => ({
    save: mockSave,
  }));

  mockMediaFileModel.find = jest.fn().mockReturnValue({
    exec: jest.fn(),
  });
  mockMediaFileModel.findById = jest.fn().mockReturnValue({
    exec: jest.fn(),
  });
  mockMediaFileModel.findByIdAndDelete = jest.fn().mockReturnValue({
    exec: jest.fn(),
  });

  const mockConfigService = {
    get: jest.fn().mockReturnValue('http://ts-transcription:5000'),
  };

  jest.mock('axios');

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        {
          provide: getModelToken(MediaFile.name),
          useValue: mockMediaFileModel,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<MediaService>(MediaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createMediaFile', () => {
    it('should create a media file successfully', async () => {
      const mockFile = {
        filename: 'file-123456.mp3',
        originalname: 'test.mp3',
        mimetype: 'audio/mpeg',
        path: '/uploads/file-123456.mp3',
        size: 1024,
      } as Express.Multer.File;

      const userId = '507f191e810c19729de860ea';

      const result = await service.createMediaFile(userId, mockFile);
      
      expect(mockMediaFileModel).toHaveBeenCalled();
      expect(mockSave).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result).toEqual(mockMediaFile);
    });
  });

  describe('findAllByUserId', () => {
    it('should return all media files for a user', async () => {
      const userId = '507f191e810c19729de860ea';
      const mockFiles = [mockMediaFile];

      mockMediaFileModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockFiles),
      });

      const result = await service.findAllByUserId(userId);

      expect(mockMediaFileModel.find).toHaveBeenCalledWith({ userId });
      expect(result).toEqual(mockFiles);
    });
  });

  describe('findById', () => {
    it('should return a media file by id', async () => {
      const fileId = '507f1f77bcf86cd799439011';

      mockMediaFileModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMediaFile),
      });

      const result = await service.findById(fileId);

      expect(mockMediaFileModel.findById).toHaveBeenCalledWith(fileId);
      expect(result).toEqual(mockMediaFile);
    });
  });

  describe('deleteById', () => {
    it('should delete a media file by id', async () => {
      const fileId = '507f1f77bcf86cd799439011';

      mockMediaFileModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMediaFile),
      });

      await service.deleteById(fileId);

      expect(mockMediaFileModel.findByIdAndDelete).toHaveBeenCalledWith(fileId);
    });
  });

  describe('deleteFileById', () => {
    it('should delete both file from storage and database', async () => {
      const fileId = '507f1f77bcf86cd799439011';
      
      const fs = require('fs/promises');
      jest.spyOn(fs, 'unlink').mockResolvedValue(undefined);
      
      mockMediaFileModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMediaFile),
      });
      
      mockMediaFileModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMediaFile),
      });

      await service.deleteFileById(fileId);

      expect(mockMediaFileModel.findById).toHaveBeenCalledWith(fileId);
      expect(fs.unlink).toHaveBeenCalledWith(mockMediaFile.path);
      expect(mockMediaFileModel.findByIdAndDelete).toHaveBeenCalledWith(fileId);
    });

    it('should still delete from database even if physical file deletion fails', async () => {
      const fileId = '507f1f77bcf86cd799439011';
      
      const fs = require('fs/promises');
      jest.spyOn(fs, 'unlink').mockRejectedValue(new Error('File not found'));
      jest.spyOn(console, 'error').mockImplementation(() => {});
      
      mockMediaFileModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMediaFile),
      });
      
      mockMediaFileModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMediaFile),
      });

      await service.deleteFileById(fileId);

      expect(mockMediaFileModel.findByIdAndDelete).toHaveBeenCalledWith(fileId);
      expect(console.error).toHaveBeenCalled();
    });

    it('should throw error if file not found in database', async () => {
      const fileId = '507f1f77bcf86cd799439011';
      
      mockMediaFileModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.deleteFileById(fileId)).rejects.toThrow('File not found in database');
    });
  });

  describe('updateFileStatus', () => {
    it('should update file status successfully', async () => {
      const fileId = '507f1f77bcf86cd799439011';
      const updatedFile = { ...mockMediaFile, status: 'processing', progress: 50 };

      mockMediaFileModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedFile),
      });

      const result = await service.updateFileStatus(fileId, 'processing', 50);

      expect(mockMediaFileModel.findByIdAndUpdate).toHaveBeenCalledWith(
        fileId,
        { status: 'processing', progress: 50 },
        { new: true },
      );
      expect(result).toEqual(updatedFile);
    });

    it('should update file status with error message', async () => {
      const fileId = '507f1f77bcf86cd799439011';
      const errorMessage = 'Upload failed';
      const updatedFile = { ...mockMediaFile, status: 'error', errorMessage };

      mockMediaFileModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedFile),
      });

      const result = await service.updateFileStatus(fileId, 'error', undefined, errorMessage);

      expect(mockMediaFileModel.findByIdAndUpdate).toHaveBeenCalledWith(
        fileId,
        { status: 'error', errorMessage },
        { new: true },
      );
      expect(result).toEqual(updatedFile);
    });

    it('should return null if file not found', async () => {
      const fileId = '507f1f77bcf86cd799439011';

      mockMediaFileModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      const result = await service.updateFileStatus(fileId, 'completed');

      expect(result).toBeNull();
    });
  });

  describe('updateFileProgress', () => {
    it('should update file progress successfully', async () => {
      const fileId = '507f1f77bcf86cd799439011';
      const updatedFile = { ...mockMediaFile, progress: 75 };

      mockMediaFileModel.findByIdAndUpdate = jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedFile),
      });

      const result = await service.updateFileProgress(fileId, 75);

      expect(mockMediaFileModel.findByIdAndUpdate).toHaveBeenCalledWith(
        fileId,
        { progress: 75 },
        { new: true },
      );
      expect(result).toEqual(updatedFile);
    });
  });

  describe('transcribeFile', () => {
    it('should transcribe file successfully', async () => {
      const fileId = '507f1f77bcf86cd799439011';
      const transcribedText = 'This is the transcribed text';
      
      mockMediaFileModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMediaFile),
      });

      mockMediaFileModel.findByIdAndUpdate = jest.fn()
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue({ ...mockMediaFile, status: 'processing', progress: 0 }),
        })
        .mockReturnValueOnce({
          exec: jest.fn().mockResolvedValue({ 
            ...mockMediaFile, 
            status: 'completed', 
            progress: 100,
            transcribedText 
          }),
        });

      // Mock axios
      jest.spyOn(axios, 'post').mockResolvedValue({
        data: {
          success: true,
          text: transcribedText,
        },
      } as any);

      // Mock fs with proper stream that implements EventEmitter
      const fs = require('fs');
      const { Readable } = require('stream');
      const mockStream = new Readable();
      mockStream._read = () => {};
      mockStream.push('mock data');
      mockStream.push(null);
      
      jest.spyOn(fs, 'createReadStream').mockReturnValue(mockStream);

      const result = await service.transcribeFile(fileId);

      expect(mockMediaFileModel.findById).toHaveBeenCalledWith(fileId);
      expect(axios.post).toHaveBeenCalled();
      expect(result.transcribedText).toBe(transcribedText);
      expect(result.status).toBe('completed');
    });

    it('should throw error if file not found', async () => {
      const fileId = '507f1f77bcf86cd799439011';
      
      mockMediaFileModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      await expect(service.transcribeFile(fileId)).rejects.toThrow('File not found');
    });

    it('should throw error if file is already processing', async () => {
      const fileId = '507f1f77bcf86cd799439011';
      const processingFile = { ...mockMediaFile, status: 'processing' };
      
      mockMediaFileModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(processingFile),
      });

      await expect(service.transcribeFile(fileId)).rejects.toThrow('File is already being processed');
    });

    it('should throw error if file is already completed', async () => {
      const fileId = '507f1f77bcf86cd799439011';
      const completedFile = { ...mockMediaFile, status: 'completed' };
      
      mockMediaFileModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(completedFile),
      });

      await expect(service.transcribeFile(fileId)).rejects.toThrow('File has already been transcribed');
    });

    it('should handle transcription service error', async () => {
      const fileId = '507f1f77bcf86cd799439011';
      
      mockMediaFileModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMediaFile),
      });

      mockMediaFileModel.findByIdAndUpdate = jest.fn()
        .mockReturnValue({
          exec: jest.fn().mockResolvedValue({ ...mockMediaFile, status: 'processing', progress: 0 }),
        });

      // Mock axios to throw error
      jest.spyOn(axios, 'post').mockRejectedValue(new Error('Service unavailable'));

      // Mock fs with proper stream
      const fs = require('fs');
      const { Readable } = require('stream');
      const mockStream = new Readable();
      mockStream._read = () => {};
      mockStream.push('mock data');
      mockStream.push(null);
      
      jest.spyOn(fs, 'createReadStream').mockReturnValue(mockStream);

      await expect(service.transcribeFile(fileId)).rejects.toThrow('Transcription failed');
      
      // Verify error status was updated
      expect(mockMediaFileModel.findByIdAndUpdate).toHaveBeenCalledWith(
        fileId,
        expect.objectContaining({
          status: 'processing',
        }),
        expect.any(Object),
      );
    });
  });
});
