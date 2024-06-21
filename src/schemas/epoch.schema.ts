import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EpochDocument = HydratedDocument<Epoch>;

@Schema({ collection: 'epoch' })
export class Epoch {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop()
  numericId: number;

  @Prop({ required: true })
  contractAddress: string;
}

export const EpochSchema = SchemaFactory.createForClass(Epoch);
