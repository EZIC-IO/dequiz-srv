import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { SrvService } from './srv.service';
import { ImageService } from './image.service';
import { IPFSService } from './ipfs.service';
import { GenImgDto, InitPublishDto } from './dto';
import { RateLimiterProxyGuard } from './guards/rate-limiter-proxy.guard';
import { Throttle } from '@nestjs/throttler';

@Controller()
export class SrvController {
  constructor(
    private readonly srvService: SrvService,
    private readonly imgService: ImageService,
    private readonly ipfsService: IPFSService,
  ) {}

  @Get()
  getHello(): Promise<string> {
    return this.srvService.getHello();
  }

  // >> Image generation is available for 4 requests per 45 minutes to prevent abuse
  @UseGuards(RateLimiterProxyGuard)
  @Throttle({ default: { limit: 4, ttl: 45 * 60000 } })
  @Post('gen-img')
  async genImage(@Body() data: GenImgDto) {
    const genAction = await this.imgService.generateImage(
      data.prompt,
      data.sessionUUID,
    );

    return genAction;
  }

  // >> IPFS upload is available for 4 requests per 10 minutes to prevent abuse
  @UseGuards(RateLimiterProxyGuard)
  @Throttle({ default: { limit: 4, ttl: 10 * 60000 } })
  @Post('init-publish')
  async initiatePublishToIPFS(@Body() { genActionId }: InitPublishDto) {
    await this.ipfsService.uploadNFTImgAndMetadata(genActionId);
    return { success: true };
  }
}
