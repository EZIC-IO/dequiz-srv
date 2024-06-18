import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThirdwebStorage } from '@thirdweb-dev/storage';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectRedis } from '@songkeys/nestjs-redis';

import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fse from 'fs-extra';

@Injectable()
export class IPFSService {
  private readonly logger = new Logger(IPFSService.name);
  private ipfsSdk: ThirdwebStorage;
  private readonly ttlInMinutes = 3;
  private readonly thidWebApiKey =
    this.configService.get<string>('THIRDWEB_API_KEY');

  private readonly testMetadata = {
    name: 'Test Metadata',
    description: 'Test Description',
    attributes: [{ trait_type: 'IS TEST', value: 'YES' }],
  };

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    this.ipfsSdk = new ThirdwebStorage({
      secretKey: configService.get<string>('THIRDWEB_API_KEY'),
    });
  }

  public async uploadNFTImgAndMetadata(imgUrl: string) {
    const response = await this.httpService.axiosRef.get(imgUrl, {
      responseType: 'stream',
    });
    const fileId = uuidv4();
    const filePath = path.join(__dirname, '..', 'img-files', `${fileId}.png`);

    const writer = fse.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on('error', (error) => {
      this.logger.error(`Error writing file: ${error.message}`);
    });

    writer.on('finish', () => {
      this.logger.log(`File downloaded: ${fileId}`);
      this.logger.verbose(
        `File will be deleted in ${this.ttlInMinutes} minute(s)`,
      );

      // >> Upload image to IPFS
      const ipfsUpload = this.ipfsSdk.upload(fse.readFileSync(filePath));
      ipfsUpload.then(
        (ipfsImgURL) => {
          this._logIPFSUploads(ipfsImgURL);
          this.redis.set(`IPFS_IMG_${fileId}`, ipfsImgURL);

          // >> Upload JSON metadata to IPFS
          const jsonMetadataUpload = this.ipfsSdk.upload(
            fse.readFileSync(this._prepareJsonMetadata(ipfsImgURL)),
          );
          jsonMetadataUpload.then(
            (ipfsJsonURL) => {
              this._logIPFSUploads(ipfsJsonURL);
              this.redis.set(`IPFS_JSON_${fileId}`, ipfsJsonURL);
            },
            (err) => this.logger.error(`Unable to upload to IPFS: ${err}`),
          );
        },
        (err) => this.logger.error(`Unable to upload to IPFS: ${err}`),
      );

      // >> Cleanup file after specified amount of minutes
      this._scheduleFileCleanup(filePath, this.ttlInMinutes);
    });
  }

  private _scheduleFileCleanup(filePath: string, ttlInMinutes: number) {
    // >> Cleanup file after specified amount of minutes
    const rmFileJob = setTimeout(() => {
      fse.unlink(filePath, (err) => {
        if (err) {
          this.logger.error(`Error deleting file: ${err.message}`);
        } else {
          this.logger.log(`File ${filePath} deleted successfully`);
        }
      });
    }, ttlInMinutes * 60000);
    this.schedulerRegistry.addTimeout(`RM_FILE >> ${filePath}`, rmFileJob);
  }

  private _prepareJsonMetadata(ipfsImgUrl: string): string {
    const metadataJSON = JSON.stringify(
      {
        ...this.testMetadata,
        image: ipfsImgUrl,
      },
      null,
      2,
    );
    const fileName = uuidv4();
    const filePath = path.join(
      __dirname,
      '..',
      'json-metadata-files',
      `${fileName}.json`,
    );
    fse.writeFileSync(filePath, metadataJSON, 'utf-8');
    this._scheduleFileCleanup(filePath, this.ttlInMinutes);
    return filePath;
  }

  private _logIPFSUploads(ipfsURL: string) {
    const resolvedURL = this.ipfsSdk.resolveScheme(ipfsURL);
    this.logger.log(`IPFS URL - ${ipfsURL}`);
    this.logger.log(`Gateway URL - ${resolvedURL}`);
  }
}
