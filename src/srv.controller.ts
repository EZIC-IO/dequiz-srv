import { Body, Controller, Get, Post } from '@nestjs/common';
import { SrvService } from './srv.service';
import { ImageService } from './image.service';
import { IPFSService } from './ipfs.service';
import { GenImgDto } from './dto';

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

  @Post('gen-img')
  async genImage(@Body() data: GenImgDto) {
    const imgUrl = await this.imgService.generateImage(data.prompt);
    await this.ipfsService.uploadNFTImgAndMetadata(imgUrl);
    return { imgUrl, success: true };
  }
}
