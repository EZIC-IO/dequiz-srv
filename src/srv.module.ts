import {
  Global,
  MiddlewareConsumer,
  Module,
  RequestMethod,
} from '@nestjs/common';
import { SrvController } from './srv.controller';
import {
  SrvService,
  ImageService,
  IPFSService,
  PromptConstructionService,
  NFTMetadataService,
} from './services';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { MongooseModule } from '@nestjs/mongoose';
import { Epoch, EpochSchema } from './schemas/epoch.schema';
import {
  GenerationAction,
  GenerationActionSchema,
} from './schemas/generation.schema';
import { ThrottlerModule } from '@nestjs/throttler';
import { WebsocketGateway } from './websocket.gateway';
import { SocketService } from './services/socket.service';
import { SecureSignatureMiddleware } from './middlewares';

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
export class SrvModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(SecureSignatureMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.POST });
  }
}
