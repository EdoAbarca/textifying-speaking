import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { AuthProvider } from '../dto/create-user.dto';

export type UserDocument = User & Document;

@Schema({ timestamps: true })  // Auto-adds `createdAt` and `updatedAt`
export class User {
  @Prop({ 
    unique: true, 
    required: true, 
    trim: true, 
    lowercase: true 
  })
  email: string;

  @Prop({ 
    required: true, 
    enum: AuthProvider, 
    index: true 
  })
  authProvider: AuthProvider;

  @Prop({ 
    required: true, 
    unique: true, 
    index: true 
  })
  authProviderId: string;
}

export const UserSchema = SchemaFactory.createForClass(User);