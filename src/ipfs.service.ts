import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThirdwebStorage } from '@thirdweb-dev/storage';
import { SchedulerRegistry } from '@nestjs/schedule';

import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fse from 'fs-extra';

@Injectable()
export class IPFSService {
  private readonly logger = new Logger(IPFSService.name);
  private ipfsSdk: ThirdwebStorage;
  private readonly ttlInMinutes = 1;
  private readonly thidWebApiKey =
    this.configService.get<string>('THIRDWEB_API_KEY');

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    this.ipfsSdk = new ThirdwebStorage({
      secretKey: configService.get<string>('THIRDWEB_API_KEY'),
    });
  }

  public async uploadSingleFileFromUrl(url: string) {
    const response = await this.httpService.axiosRef.get(url, {
      responseType: 'stream',
    });
    const filePath = path.join(__dirname, '..', 'img-files', `${uuidv4()}.png`);

    const writer = fse.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on('error', (error) => {
      this.logger.error(`Error writing file: ${error.message}`);
    });

    writer.on('finish', () => {
      this.logger.log(`File downloaded: ${filePath}`);
      this.logger.verbose(
        `File will be deleted in ${this.ttlInMinutes} minute(s)`,
      );

      // Cleanup file after specified amount of minutes
      const rmFileJob = setTimeout(() => {
        fse.unlink(filePath, (err) => {
          if (err) {
            this.logger.error(`Error deleting file: ${err.message}`);
          } else {
            this.logger.log(`File ${filePath} deleted successfully`);
          }
        });
      }, this.ttlInMinutes * 60000);
      this.schedulerRegistry.addTimeout(`RM_FILE >> ${filePath}`, rmFileJob);
    });
  }
}
