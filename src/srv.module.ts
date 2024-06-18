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

@Global()
@Module({
  imports: [
    ConfigModule.forRoot(),
    HttpModule,
    ScheduleModule.forRoot(),
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
  providers: [SrvService, ImageService, IPFSService, ConfigService],
})
export class SrvModule {}
