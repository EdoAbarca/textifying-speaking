import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
    email: string;
    authProvider: string;
    authProviderId: string;
    createdAt: Date;
}
