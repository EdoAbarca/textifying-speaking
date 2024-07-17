import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Model, ModelSchema } from '../../model/entities/model.schema';

export type KeyDocument = Key & Document;

@Schema()
export class Key {
  @Prop({ required: true })
  api_key: string;

  @Prop({ type: ModelSchema, required: true })
  model: Model;
}

export const KeySchema = SchemaFactory.createForClass(Key);

