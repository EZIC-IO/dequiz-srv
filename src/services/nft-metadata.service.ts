import { BadRequestException, Injectable } from '@nestjs/common';
import { NFTMetadata, Epoch } from '../schemas';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RPGVocation } from '../dto';

@Injectable()
export class NFTMetadataService {
  constructor(
    @InjectModel(Epoch.name)
    private epochModel: Model<Epoch>,
  ) {}

  public async prepareMetadata({
    epochId,
    ipfsImgURL,
    name,
    vocation,
  }: {
    epochId: string;
    ipfsImgURL: string;
    name: string;
    vocation: RPGVocation;
  }): Promise<NFTMetadata> {
    const epoch = await this.epochModel.findById(epochId).exec();
    if (!epoch) throw new BadRequestException('Invalid epoch specified');
    return {
      name,
      description: epoch.description,
      attributes: [
        {
          trait_type: 'vocation',
          value: vocation,
        },
      ],
      image: ipfsImgURL,
    };
  }
}
