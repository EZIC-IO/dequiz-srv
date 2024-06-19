import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';
import {
  GenerationAction,
  GenerationActionStatus,
} from './schemas/generation.schema';
import { Model } from 'mongoose';
import { Epoch } from './schemas/epoch.schema';

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);
  private readonly apiKey = this.configService.get<string>('OPENAI_API_KEY');
  private currentEpoch: Epoch;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectModel(GenerationAction.name)
    private generationActionModel: Model<GenerationAction>,
    @InjectModel(Epoch.name)
    private epochModel: Model<Epoch>,
    @InjectRedis() private readonly redis: Redis,
  ) {
    // >> Initialize current epoch;
    // >> TODO: Add ability to set current epoch in db;
    this.epochModel.findOne().then((epoch) => (this.currentEpoch = epoch));
  }

  async generateImage(prompt: string, sessionUUID: string) {
    const alreadyQueued = await this.generationActionModel.findOne({
      sessionUUID,
      status: GenerationActionStatus.PROCESSING,
    });
    if (alreadyQueued) {
      throw new BadRequestException(
        'NFT generation is already in queue, please wait for completion',
      );
    }
    const genAction = await new this.generationActionModel({
      epoch: this.currentEpoch,
      sessionUUID,
    }).save();

    try {
      const response = await this.httpService.axiosRef.post(
        'https://api.openai.com/v1/images/generations',
        {
          model: 'dall-e-3',
          prompt: prompt,
          n: 1,
          size: '1024x1024',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          timeout: 20000,
        },
      );
      const imageUrl = response.data.data[0].url;

      await genAction
        .updateOne({
          imageUrl,
          status: GenerationActionStatus.GENERATED,
        })
        .exec();
      return this.generationActionModel.findById(genAction.id).exec();
    } catch (err: any) {
      this.logger.error(
        `Failed to generate image for session ${sessionUUID}: ${err.response.data.error.message}`,
      );
      this.logger.error(err.response.data.error);
      throw new BadRequestException(err.response.data.error.message);
    }
  }
}
