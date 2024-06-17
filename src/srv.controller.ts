import { Body, Controller, Get, Post } from '@nestjs/common';
import { SrvService } from './srv.service';
import { ImageService } from './image.service';
import { GenImgDto } from './dto';

@Controller()
export class AppController {
  constructor(
    private readonly srvService: SrvService,
    private readonly imgService: ImageService,
  ) {}

  @Get()
  getHello(): string {
    return this.srvService.getHello();
  }

  @Post('gen-img')
  genImage(@Body() data: GenImgDto) {
    return this.imgService.generateImage(data.prompt);
  }
}
