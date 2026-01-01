import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    _id: 'mockId',
    username: 'testuser',
    email: 'test@example.com',
    passwordHash: 'hashedPassword',
    createdAt: new Date(),
  };

  beforeEach(async () => {
    // Clear all mock calls before each test
    jest.clearAllMocks();

    const mockUsersService = {
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      create: jest.fn(),
    };

    const mockJwtService = {
      signAsync: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully register a new user', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue(null);
      usersService.create.mockResolvedValue(mockUser as any);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      const result = await service.register(registerDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(usersService.findByUsername).toHaveBeenCalledWith(registerDto.username);
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 10);
      expect(usersService.create).toHaveBeenCalledWith({
        username: registerDto.username,
        email: registerDto.email,
        passwordHash: 'hashedPassword',
      });
      expect(result).toEqual({
        message: 'User registered successfully',
        user: {
          id: mockUser._id,
          username: mockUser.username,
          email: mockUser.email,
          createdAt: mockUser.createdAt,
        },
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);

      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('Email already registered'),
      );
      expect(usersService.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if username already exists', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue(mockUser as any);

      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('Username already taken'),
      );
      expect(usersService.findByUsername).toHaveBeenCalledWith(registerDto.username);
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException if user creation fails', async () => {
      usersService.findByEmail.mockResolvedValue(null);
      usersService.findByUsername.mockResolvedValue(null);
      usersService.create.mockRejectedValue(new Error('Database error'));
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      await expect(service.register(registerDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login a user with valid credentials', async () => {
      const mockToken = 'mock.jwt.token';
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue(mockToken);

      const result = await service.login(loginDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.passwordHash,
      );
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: mockUser._id,
        email: mockUser.email,
        username: mockUser.username,
      });
      expect(result).toEqual({
        message: 'Login successful',
        accessToken: mockToken,
        user: {
          id: mockUser._id,
          username: mockUser.username,
          email: mockUser.email,
        },
      });
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('User with such email does not exist'),
      );
      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is invalid', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Password doesn\'t match'),
      );
      expect(usersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.passwordHash,
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });
  });
});
