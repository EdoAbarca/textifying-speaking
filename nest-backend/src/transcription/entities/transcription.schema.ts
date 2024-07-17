import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Model, ModelSchema } from '../../model/entities/model.schema';

export type TranscriptionDocument = Transcription & Document;

export class Summary {
  @Prop({ required: true })
  summary_text: string;

  @Prop({ type: ModelSchema, required: true })
  model: Model;
}

@Schema({ timestamps: true }) // Actualizar timestamps en Nest.js según zona horaria
export class Transcription {
    @Prop({ required: true })
    file_name: string;

    //@Prop({ required: true })
    //date: Date; //String si Date no funciona

    @Prop({ required: true })
    transcription: string;
    
    @Prop({ required: true })
    word_count: number;

    @Prop({ type: ModelSchema, required: true })
    model: Model;

    //Conjunto de resúmenes
    @Prop({ type: [Summary], default: [] })
    summaries: Summary[];
}

export const TranscriptionSchema = SchemaFactory.createForClass(Transcription);
