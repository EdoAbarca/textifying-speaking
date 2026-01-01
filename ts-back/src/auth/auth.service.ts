import {
  Injectable,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { username, email, password } = registerDto;

    // Check if user with email already exists
    const existingUserByEmail = await this.usersService.findByEmail(email);
    if (existingUserByEmail) {
      throw new ConflictException('Email already registered');
    }

    // Check if username already exists
    const existingUserByUsername =
      await this.usersService.findByUsername(username);
    if (existingUserByUsername) {
      throw new ConflictException('Username already taken');
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    try {
      const user = await this.usersService.create({
        username,
        email,
        passwordHash,
      });

      // Return user without password hash
      return {
        message: 'User registered successfully',
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
        },
      };
    } catch (error) {
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user by email
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User with such email does not exist');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Password doesn\'t match');
    }

    // Generate JWT token
    const payload = {
      sub: user._id,
      email: user.email,
      username: user.username,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    // Return token and user info
    return {
      message: 'Login successful',
      accessToken,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
      },
    };
  }
}
