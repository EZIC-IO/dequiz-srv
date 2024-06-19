import { NestFactory } from '@nestjs/core';
import { SrvModule } from './srv.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const srv = await NestFactory.create(SrvModule, { cors: true });

  const config = new DocumentBuilder()
    .setTitle('Prototype')
    .setDescription('--')
    .setVersion('1.0')
    .addTag('core')
    .build();
  const document = SwaggerModule.createDocument(srv, config);
  SwaggerModule.setup('api', srv, document);

  await srv.listen(3030);
}
bootstrap();
