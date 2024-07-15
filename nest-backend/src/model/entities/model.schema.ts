// src/models/model.schema.ts
import { Schema, Document } from 'mongoose';

export interface Model extends Document {
  name: string;
  goal: string;
}

export const ModelSchema = new Schema({
  name: { type: String, required: true },
  goal: { type: String, required: true, enum: ['Transcript', 'Summarize'] },
});
