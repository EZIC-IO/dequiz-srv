import { Global, Module } from '@nestjs/common';
import { SrvController } from './srv.controller';
import { SrvService } from './srv.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ImageService } from './image.service';
import { RedisModule } from '@songkeys/nestjs-redis';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot(),
    HttpModule,
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        config: { url: configService.get<string>('REDIS_URL') },
      }),
    }),
  ],
  controllers: [SrvController],
  providers: [SrvService, ImageService, ConfigService],
})
export class SrvModule {}
