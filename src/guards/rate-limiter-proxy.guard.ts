import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';

import { getClientIp } from '@supercharge/request-ip';

@Injectable()
export class RateLimiterProxyGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return getClientIp(req);
  }
}
