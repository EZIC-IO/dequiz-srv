import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThirdwebStorage } from '@thirdweb-dev/storage';
import { SchedulerRegistry } from '@nestjs/schedule';

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
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly schedulerRegistry: SchedulerRegistry,
    @InjectModel(GenerationAction.name)
    private generationActionModel: Model<GenerationAction>,
  ) {
    // >> Init IPFS SDK
    this.ipfsSdk = new ThirdwebStorage({
      secretKey: this.configService.get<string>('THIRDWEB_API_KEY'),
    });
  }

  public async uploadNFTImgAndMetadata(
    genActionId: string,
  ): Promise<GenerationAction> {
    const genAction = await this.generationActionModel
      .findById(genActionId)
      .exec();

    if (!genAction || !genAction.imageUrl)
      throw new BadRequestException('Invalid generation action');

    // >> Download image to local FS
    const imgFilePath = await this._downloadImage(genAction.imageUrl);

    // >> Upload image to IPFS
    const ipfsImgURL = await this.ipfsSdk.upload(fse.readFileSync(imgFilePath));
    this._logIPFSUploads({
      ipfsURL: ipfsImgURL,
      type: 'IMG',
      genActionId,
    });

    // >> Upload JSON metadata to IPFS;
    const preparedJsonMetadata = this._prepareJsonMetadata(ipfsImgURL);
    const ipfsJsonURL = await this.ipfsSdk.upload(preparedJsonMetadata);
    this._logIPFSUploads({
      ipfsURL: ipfsJsonURL,
      type: 'JSON Metadata',
      genActionId,
    });

    // >> Generation published to IPFS completely;
    await genAction
      .updateOne({
        status: GenerationActionStatus.PUBLISHED,
        imageBareIPFS: ipfsImgURL,
        imageGatewayIPFS: this.ipfsSdk.resolveScheme(ipfsImgURL),
        metadata: preparedJsonMetadata,
        metadataBareIPFS: ipfsJsonURL,
      })
      .exec();

    const updatedGenAction = await this.generationActionModel
      .findById(genAction.id)
      .exec();

    this._scheduleFileCleanup(imgFilePath, this.ttlInMinutes);
    return updatedGenAction;
  }

  private async _downloadImage(imgUrl: string): Promise<string> {
    const response = await this.httpService.axiosRef.get(imgUrl, {
      responseType: 'stream',
    });
    const fileId = uuidv4();
    const filePath = path.join(__dirname, '..', 'img-files', `${fileId}.png`);

    return new Promise((resolve, reject) => {
      const writer = fse.createWriteStream(filePath);
      response.data.pipe(writer);
      writer.on('finish', () => resolve(filePath));
      writer.on('error', (err) => reject(err));
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

  private _prepareJsonMetadata(ipfsImgUrl: string): NFTMetadata {
    const metadata: NFTMetadata = {
      ...this.testMetadata,
      image: ipfsImgUrl,
    };
    return metadata;
  }

  private _logIPFSUploads({ ipfsURL, genActionId, type }: IPFSLogData) {
    const resolvedURL = this.ipfsSdk.resolveScheme(ipfsURL);
    this.logger.log(
      `IPFS ${type} Upload Succeeded for GEN ACTION ${genActionId}\n${type} IPFS URL - ${ipfsURL}\n${type} Gateway URL - ${resolvedURL}`,
    );
  }
}

type IPFSLogData = {
  ipfsURL: string;
  type: 'IMG' | 'JSON Metadata';
  genActionId: string;
};
