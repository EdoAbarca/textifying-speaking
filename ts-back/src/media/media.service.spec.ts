import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { MediaService } from './media.service';
import { MediaFile, MediaFileDocument } from './schemas/media-file.schema';

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
    status: 'uploaded',
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

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MediaService,
        {
          provide: getModelToken(MediaFile.name),
          useValue: mockMediaFileModel,
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
});
