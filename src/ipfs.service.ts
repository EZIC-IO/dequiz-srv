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
import { NFTMetadataService } from './nft-metadata.service';

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
    private readonly nftMetadataService: NFTMetadataService,
    private readonly schedulerRegistry: SchedulerRegistry,
    @InjectModel(GenerationAction.name)
    private generationActionModel: Model<GenerationAction>,
  ) {
    // >> Init IPFS SDK
    this.ipfsSdk = new ThirdwebStorage({
      secretKey: this.configService.get<string>('THIRDWEB_API_KEY'),
    });
  }

  public async uploadNFTImg(genActionId: string): Promise<string> {
    const genAction = await this.generationActionModel
      .findById(genActionId)
      .exec();

    this._ensureGenActionIsValid(genAction);

    // >> Download image to local FS
    const imgFilePath = await this._downloadImage(genAction.imageUrl);

    // >> Upload image to IPFS
    const ipfsImgURL = await this.ipfsSdk.upload(fse.readFileSync(imgFilePath));

    this._scheduleFileCleanup(imgFilePath, this.ttlInMinutes);
    return ipfsImgURL;
  }

  public async uploadNFTMetadata({
    genActionId,
    ipfsImgURL,
    name,
  }: {
    genActionId: string;
    ipfsImgURL: string;
    name: string;
  }): Promise<GenerationAction> {
    const genAction = await this.generationActionModel
      .findById(genActionId)
      .exec();

    this._ensureGenActionIsValid(genAction);

    const metadata = await this.nftMetadataService.prepareMetadata({
      vocation: genAction.vocation,
      epochId: genAction.epochId,
      ipfsImgURL,
      name,
    });

    // >> Upload JSON metadata to IPFS;
    const ipfsJsonURL = await this.ipfsSdk.upload(metadata);

    // >> Generation published to IPFS successfully;
    await genAction
      .updateOne({
        status: GenerationActionStatus.PUBLISHED,
        imageBareIPFS: metadata.image,
        imageGatewayIPFS: this.ipfsSdk.resolveScheme(metadata.image),
        metadata,
        metadataBareIPFS: ipfsJsonURL,
      })
      .exec();

    return this.generationActionModel.findById(genAction.id).exec();
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

  private _ensureGenActionIsValid(genAction: GenerationAction): void {
    const genActionValid =
      genAction &&
      genAction.status === GenerationActionStatus.GENERATED &&
      genAction.imageUrl;

    if (!genActionValid)
      throw new BadRequestException('Invalid generation action');
  }
}
