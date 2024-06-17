import { Body, Controller, Get, Post } from '@nestjs/common';
import { SrvService } from './srv.service';
import { ImageService } from './image.service';
import { GenImgDto } from './dto';
import { RealIP } from './decorators/real-ip.decorator';

@Controller()
export class SrvController {
  constructor(
    private readonly srvService: SrvService,
    private readonly imgService: ImageService,
  ) {}

  @Get()
  getHello(@RealIP() requesterIp: string): Promise<string> {
    console.log(requesterIp);
    return this.srvService.getHello();
  }

  @Post('gen-img')
  genImage(@Body() data: GenImgDto, @RealIP() requesterIp: string) {
    console.log(requesterIp);
    return this.imgService.generateImage(data.prompt);
  }
}
