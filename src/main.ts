import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const srv = await NestFactory.create(AppModule);
  await srv.listen(3030);
}
bootstrap();
