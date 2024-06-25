import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { GenerationAction, GenerationActionStatus, Epoch } from '../schemas';
import { Model } from 'mongoose';
import { RPGVocation } from '../dto';
import * as util from 'util';

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
  ) {
    // >> Initialize current epoch;
    // >> TODO: Add ability to set current epoch in db;
    this.epochModel.findOne().then((epoch) => (this.currentEpoch = epoch));
  }

  async generateImage(
    genPrompt: string,
    identityHash: string,
    vocation: RPGVocation,
  ) {
    const alreadyQueued = await this.generationActionModel.findOne({
      identityHash,
      status: GenerationActionStatus.PROCESSING,
      // >> Ensure that the generation action was created within the last minute
      createdAt: { $gt: Date.now() - 1000 * 60 },
    });
    if (alreadyQueued) {
      throw new BadRequestException(
        'NFT generation is already in queue, please wait for completion or try again in a minute',
      );
    }
    const genAction = await new this.generationActionModel({
      epochId: this.currentEpoch,
      vocation,
      identityHash,
    }).save();

    try {
      const response = await this.httpService.axiosRef.post(
        'https://api.openai.com/v1/images/generations',
        {
          model: 'dall-e-3',
          prompt: genPrompt,
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
        `Failed to generate image for session ${identityHash}; See below:`,
      );
      this.logger.error(util.inspect(err, { depth: null }));
      throw new BadRequestException(err?.response?.data?.error?.message);
    }
  }
}
