import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@songkeys/nestjs-redis';
import { Redis } from 'ioredis';

@Injectable()
export class SrvService {
  constructor(@InjectRedis() private readonly redis: Redis) {}

  async getHello(): Promise<string> {
    const tempRandomWalletForTest = `0x${Math.random().toString(36).slice(2, 7)}`;
    await this.redis.set(tempRandomWalletForTest, 'TEST!');
    return this.redis.get(tempRandomWalletForTest);
  }
}
