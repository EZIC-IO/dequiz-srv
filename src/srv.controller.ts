import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SrvService } from './srv.service';
import { ImageService } from './image.service';
import { IPFSService } from './ipfs.service';
import { GenImgDto, InitPublishDto, ReportSuccessfulMintDto } from './dto';
import { RateLimiterProxyGuard } from './guards/rate-limiter-proxy.guard';
import { Throttle } from '@nestjs/throttler';
import { PromptConstructionService } from './prompt.service';

@Controller()
export class SrvController {
  constructor(
    private readonly srvService: SrvService,
    private readonly promptConstructionService: PromptConstructionService,
    private readonly imgService: ImageService,
    private readonly ipfsService: IPFSService,
  ) {}

  @Get()
  getHello(): string {
    return this.srvService.getHello();
  }

  @Get('latest-gen-action/:identityHash')
  async getLatestGenAction(@Param('identityHash') identityHash: string) {
    return this.srvService.getLatestGenActionBySessionUUID(identityHash);
  }

  // >> Image generation is available for 4 requests per 45 minutes to prevent abuse
  @UseGuards(RateLimiterProxyGuard)
  @Throttle({ default: { limit: 4, ttl: 45 * 60000 } })
  @Post('gen-img')
  async genImage(@Body() data: GenImgDto) {
    const genPrompt =
      this.promptConstructionService.constructFantasyWorldRPGPrompt(
        data.payload,
      );
    const genAction = await this.imgService.generateImage(
      genPrompt,
      data.identityHash,
      data.payload.rpgVocation,
    );

    return genAction;
  }

  // >> IPFS upload is available for 4 requests per 10 minutes to prevent abuse
  @UseGuards(RateLimiterProxyGuard)
  @Throttle({ default: { limit: 4, ttl: 10 * 60000 } })
  @Post('init-publish')
  async initiatePublishToIPFS(@Body() { genActionId, name }: InitPublishDto) {
    const ipfsImgURL = await this.ipfsService.uploadNFTImg(genActionId);
    return this.ipfsService.uploadNFTMetadata({
      genActionId,
      ipfsImgURL,
      name,
    });
  }

  @Post('report-successful-mint')
  async reportSuccessfulMing(@Body() data: ReportSuccessfulMintDto) {
    return this.srvService.reportSuccessfulMint(data);
  }
}
