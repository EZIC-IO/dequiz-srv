import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class SecureSignatureMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (!process.env.SECURE_MODE) next(); // >> Bypass middleware if not in secure mode
    const secret = process.env.DEQUIZ_SIGNATURE_KEY;
    const { originalUrl, headers } = req;
    const timestamp = req.query.timestamp;

    if (!timestamp || !headers['x-signature']) {
      throw new UnauthorizedException('Missing signature or timestamp');
    }

    const message = `${originalUrl.split('?')[0]}?timestamp=${timestamp}`;
    console.dir(message);
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(message)
      .digest('hex');

    if (headers['x-signature'] !== expectedSignature) {
      throw new UnauthorizedException('Invalid signature');
    }

    next();
  }
}
