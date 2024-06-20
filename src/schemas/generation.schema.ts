import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument } from 'mongoose';
import { RPGVocation } from 'src/dto';

export type GenerationActionDocument = HydratedDocument<GenerationAction>;

export class NFTPropertyAttribute {
  trait_type: string;
  value: string;
}

export class NFTMetadata {
  name: string;
  description: string;
  image: string;
  attributes: NFTPropertyAttribute[];
}

export enum GenerationActionStatus {
  PROCESSING = 'PROCESSING',
  GENERATED = 'GENERATED',
  PUBLISHED = 'PUBLISHED',
  MINTED = 'MINTED',
}

@Schema()
export class GenerationAction {
  @Prop({ required: true })
  sessionUUID!: string;

  @Prop({
    required: true,
    enum: GenerationActionStatus,
    default: GenerationActionStatus.PROCESSING,
  })
  status: string;

  @Prop()
  vocation: RPGVocation;

  @Prop()
  imageUrl: string;

  @Prop()
  imageBareIPFS: string;

  @Prop()
  imageGatewayIPFS: string;

  @Prop()
  metadataBareIPFS: string;

  @Prop({ type: NFTMetadata })
  metadata: NFTMetadata;

  @Prop({ default: Date.now })
  createdAt: number;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Epoch', required: true })
  epochId: string;
}

export const GenerationActionSchema =
  SchemaFactory.createForClass(GenerationAction);
