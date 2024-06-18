import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EpochDocument = HydratedDocument<Epoch>;

@Schema()
export class Epoch {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: true })
  contractAddress!: string;
}

export const EpochSchema = SchemaFactory.createForClass(Epoch);
