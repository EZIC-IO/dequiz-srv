import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { GenerationAction, GenerationActionStatus, Epoch } from '../schemas';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { ReportSuccessfulMintDto } from '../dto';
import { EXTERNAL_CONVENIENCE_BASE_URLS } from '../constants';

@Injectable()
export class SrvService {
  constructor(
    private configService: ConfigService,
    @InjectModel(GenerationAction.name)
    private generationActionModel: Model<GenerationAction>,
    @InjectModel(Epoch.name)
    private epochModel: Model<Epoch>,
  ) {}

  getHello(): string {
    return 'hello';
  }

  async getLatestGenActionByIdentityHash(
    identityHash: string,
  ): Promise<GenerationAction> {
    const genAction = await this.generationActionModel
      .findOne({ identityHash })
      .sort({ createdAt: -1 })
      .exec();
    if (!genAction) {
      return null;
    }

    return genAction;
  }

  async getMintedGenActionByIdentityHash(
    identityHash: string,
  ): Promise<GenerationAction> {
    const genAction = await this.generationActionModel
      .findOne({ identityHash, status: GenerationActionStatus.MINTED })
      .sort({ createdAt: -1 })
      .exec();
    if (!genAction) {
      return null;
    }

    return genAction;
  }

  async reportSuccessfulMint({
    genActionId,
    mintTx,
    nftTokenId,
  }: ReportSuccessfulMintDto): Promise<UpdatedFields> {
    const genAction = await this.generationActionModel.findById(genActionId);
    if (genAction.status !== GenerationActionStatus.PUBLISHED) {
      throw new BadRequestException('Incorrect generation action;');
    }

    const epoch = await this.epochModel.findById(genAction.epochId);
    if (!epoch) {
      throw new InternalServerErrorException('Sorry, something went wrong;');
    }

    const openSeaBaseUrl =
      this.configService.get<string>('NET') === 'mainnet'
        ? EXTERNAL_CONVENIENCE_BASE_URLS.mainnet.openSea
        : EXTERNAL_CONVENIENCE_BASE_URLS.testnet.openSea;

    const txBlockExplorerBaseUrl =
      this.configService.get<string>('NET') === 'mainnet'
        ? EXTERNAL_CONVENIENCE_BASE_URLS.mainnet.txBlockExplorer
        : EXTERNAL_CONVENIENCE_BASE_URLS.testnet.txBlockExplorer;

    const updatedFields: UpdatedFields = {
      status: GenerationActionStatus.MINTED,
      mintTx,
      openSeaUrl: `${openSeaBaseUrl}/${epoch.contractAddress}/${nftTokenId}`,
      txBlockExplorerUrl: `${txBlockExplorerBaseUrl}/${mintTx}`,
    };

    await genAction.updateOne(updatedFields).exec();

    return updatedFields;
  }
}

type UpdatedFields = Pick<
  GenerationAction,
  'status' | 'mintTx' | 'openSeaUrl' | 'txBlockExplorerUrl'
>;
