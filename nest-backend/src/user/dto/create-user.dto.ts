import { IsEmail, IsEnum, IsString } from 'class-validator';

export enum AuthProvider {
  GOOGLE = 'google',
  FIREBASE = 'firebase',
  GITHUB = 'github',
}

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsEnum(AuthProvider)
  authProvider: AuthProvider;

  @IsString()
  authProviderId: string;
}