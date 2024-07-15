import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ModelDocument = Model & Document;

@Schema()
export class Model {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  goal: string;
}

export const ModelSchema = SchemaFactory.createForClass(Model);
