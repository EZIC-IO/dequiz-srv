import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThirdwebStorage } from '@thirdweb-dev/storage';
import { SchedulerRegistry } from '@nestjs/schedule';
import { InjectRedis } from '@songkeys/nestjs-redis';

import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fse from 'fs-extra';
import { InjectModel } from '@nestjs/mongoose';
import {
  GenerationAction,
  GenerationActionStatus,
  NFTMetadata,
} from './schemas/generation.schema';
import { Model } from 'mongoose';

@Injectable()
export class IPFSService {
  private readonly logger = new Logger(IPFSService.name);
  private ipfsSdk: ThirdwebStorage;
  private readonly ttlInMinutes = 60;

  private readonly testMetadata: Omit<NFTMetadata, 'image'> = {
    name: 'Test Metadata',
    description: 'Test Description',
    attributes: [{ trait_type: 'IS TEST', value: 'YES' }],
  };

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly schedulerRegistry: SchedulerRegistry,
    @InjectModel(GenerationAction.name)
    private generationActionModel: Model<GenerationAction>,
  ) {
    // >> Init IPFS SDK
    this.ipfsSdk = new ThirdwebStorage({
      secretKey: configService.get<string>('THIRDWEB_API_KEY'),
    });
  }

  public async uploadNFTImgAndMetadata(imgUrl: string, sessionUUID: string) {
    const genAction = await this.generationActionModel
      .findOne({ sessionUUID })
      .sort({ createdAt: -1 })
      .exec();

    if (!genAction) throw new BadRequestException('No session;');

    // >> Download image to local FS
    const response = await this.httpService.axiosRef.get(imgUrl, {
      responseType: 'stream',
    });
    const fileId = uuidv4();
    const filePath = path.join(__dirname, '..', 'img-files', `${fileId}.png`);

    const writer = fse.createWriteStream(filePath);
    response.data.pipe(writer);

    writer.on('error', (error) => {
      this.logger.error(
        `Error writing img file for session ${sessionUUID}: ${error.message}`,
      );
    });

    writer.on('finish', () => {
      // >> Upload image to IPFS
      const ipfsUpload = this.ipfsSdk.upload(fse.readFileSync(filePath));
      ipfsUpload.then(
        (ipfsImgURL) => {
          this._logIPFSUploads({
            ipfsURL: ipfsImgURL,
            type: 'IMG',
            sessionUUID,
          });
          // >> Upload JSON metadata to IPFS;
          const preparedJsonMetadata = this._prepareJsonMetadata(ipfsImgURL);
          const jsonMetadataUpload = this.ipfsSdk.upload(
            fse.readFileSync(preparedJsonMetadata.filePath),
          );
          jsonMetadataUpload.then(
            (ipfsJsonURL) => {
              this._logIPFSUploads({
                ipfsURL: ipfsJsonURL,
                type: 'JSON Metadata',
                sessionUUID,
              });

              // Generation published to IPFS completely;
              genAction
                .updateOne({
                  status: GenerationActionStatus.PUBLISHED,
                  imageUUID: fileId,
                  imageBareIPFS: ipfsImgURL,
                  imageGatewayIPFS: this.ipfsSdk.resolveScheme(ipfsImgURL),
                  metadata: preparedJsonMetadata.metadata,
                  metadataBareIPFS: ipfsJsonURL,
                })
                .exec();
            },
            (err) =>
              this.logger.error(
                `Unable to upload JSON Metadata to IPFS for session ${sessionUUID}: ${err}`,
              ),
          );
        },
        (err) =>
          this.logger.error(
            `Unable to upload to image to IPFS for session ${sessionUUID}: ${err}`,
          ),
      );

      // >> Cleanup file after specified amount of minutes;
      this._scheduleFileCleanup(filePath, this.ttlInMinutes);
    });
  }

  private _scheduleFileCleanup(filePath: string, ttlInMinutes: number) {
    // >> Cleanup file after specified amount of minutes;
    const rmFileJob = setTimeout(() => {
      fse.unlink(filePath, (err) => {
        if (err) {
          this.logger.error(`Error during file cleanup: ${err.message}`);
        }
      });
    }, ttlInMinutes * 60000);
    this.schedulerRegistry.addTimeout(`RM_FILE >> ${filePath}`, rmFileJob);
  }

  private _prepareJsonMetadata(ipfsImgUrl: string): {
    filePath: string;
    metadata: NFTMetadata;
  } {
    const metadata: NFTMetadata = {
      ...this.testMetadata,
      image: ipfsImgUrl,
    };
    const metadataJSON = JSON.stringify(metadata, null, 2);
    const fileName = uuidv4();
    const filePath = path.join(
      __dirname,
      '..',
      'json-metadata-files',
      `${fileName}.json`,
    );
    fse.writeFileSync(filePath, metadataJSON, 'utf-8');
    this._scheduleFileCleanup(filePath, this.ttlInMinutes);
    return { filePath, metadata };
  }

  private _logIPFSUploads({ ipfsURL, sessionUUID, type }: IPFSLogData) {
    const resolvedURL = this.ipfsSdk.resolveScheme(ipfsURL);
    this.logger.log(
      `IPFS ${type} Upload Succeeded for ${sessionUUID}\n${type} IPFS URL - ${ipfsURL}\n${type} Gateway URL - ${resolvedURL}`,
    );
  }
}

type IPFSLogData = {
  ipfsURL: string;
  type: 'IMG' | 'JSON Metadata';
  sessionUUID: string;
};
