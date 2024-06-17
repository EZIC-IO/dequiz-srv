import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@songkeys/nestjs-redis';
import Redis from 'ioredis';

@Injectable()
export class ImageService {
  private readonly logger = new Logger(ImageService.name);
  private readonly apiKey = this.configService.get<string>('OPENAI_API_KEY');

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
  ) {}

  async generateImage(prompt: string): Promise<string> {
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
        },
      );
      const imageUrl = response.data.data[0].url;
      const tempRandomWalletForTest = `0x${Math.random().toString(36).slice(2, 7)}`;
      await this.redis.set(tempRandomWalletForTest, imageUrl);
      return this.redis.get(tempRandomWalletForTest);
    } catch (err: any) {
      this.logger.debug(err.response.data.error);
      throw new BadRequestException(err.response.data.error.message);
    }
  }
}
