import { Global, Module } from '@nestjs/common';
import { SrvController } from './srv.controller';
import { SrvService } from './srv.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ImageService } from './image.service';
import { RedisModule } from '@songkeys/nestjs-redis';
import { ScheduleModule } from '@nestjs/schedule';
import { IPFSService } from './ipfs.service';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot(),
    HttpModule,
    ScheduleModule.forRoot(),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        config: { url: configService.get<string>('REDIS_URL') },
      }),
    }),
  ],
  controllers: [SrvController],
  providers: [SrvService, ImageService, IPFSService, ConfigService],
})
export class SrvModule {}
