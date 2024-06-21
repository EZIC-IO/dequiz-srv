import { Global, Module } from '@nestjs/common';
import { SrvController } from './srv.controller';
import { SrvService } from './srv.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ImageService } from './image.service';
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
import { WebsocketGateway } from './websocket.gateway';
import { SocketService } from './socket.service';
import { NFTMetadataService } from './nft-metadata.service';

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
        dbName: 'dequiz',
      }),
      inject: [ConfigService],
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
    NFTMetadataService,
    WebsocketGateway,
    SocketService,
  ],
})
export class SrvModule {}
