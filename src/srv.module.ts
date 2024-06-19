import { Global, Module } from '@nestjs/common';
import { SrvController } from './srv.controller';
import { SrvService } from './srv.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ImageService } from './image.service';
import { RedisModule } from '@songkeys/nestjs-redis';
import { ScheduleModule } from '@nestjs/schedule';
import { IPFSService } from './ipfs.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Epoch, EpochSchema } from './schemas/epoch.schema';
import {
  GenerationAction,
  GenerationActionSchema,
} from './schemas/generation.schema';
import { ThrottlerModule } from '@nestjs/throttler';
import { PromptConstructionService } from './prompt.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot(),
    HttpModule,
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        ttl: 1 * 60000,
        limit: 100,
      },
    ]),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URL'),
        dbName: 'core',
      }),
      inject: [ConfigService],
    }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        config: { url: configService.get<string>('REDIS_URL') },
      }),
    }),
    MongooseModule.forFeature([
      { name: Epoch.name, schema: EpochSchema },
      { name: GenerationAction.name, schema: GenerationActionSchema },
    ]),
  ],
  controllers: [SrvController],
  providers: [
    SrvService,
    ImageService,
    IPFSService,
    ConfigService,
    PromptConstructionService,
  ],
})
export class SrvModule {}
