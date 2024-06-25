import { Injectable } from '@nestjs/common';
import { Gender, GenPayloadDto, RPGVocation } from '../dto';

@Injectable()
export class PromptConstructionService {
  constructor() {}

  public constructFantasyWorldRPGPrompt({
    rpgVocation,
    eyeColor,
    facialHair,
    gender,
    hairColor,
    hairLength,
  }: GenPayloadDto): string {
    let prompt = `An anime-style ${gender !== Gender.OTHER ? gender : ''} ${rpgVocation} from a fantasy RPG world. `;
    prompt += `The style is bright, vibrant, and majestic. The canvas should always be black or immersive. `;
    prompt += `${this._getWho(gender)} has ${hairLength} ${hairColor} hair, ${eyeColor} eyes, and ${this._getWhos(gender)} face is clearly visible. `;
    prompt += `${this._getWho(gender)} is wearing ${this._getClothes(rpgVocation)}, practical clothing, ready for action. `;
    if (gender === Gender.MALE && facialHair) {
      prompt += `He has facial hair (beard). `;
    }
    prompt += `The background features ${this._getBackground(rpgVocation)} without unnecessary symbols or writings.`;
    return prompt;
  }

  private _getWho(gender: Gender): string {
    switch (gender) {
      case Gender.MALE:
        return 'He';
      case Gender.FEMALE:
        return 'She';
      case Gender.OTHER:
        return 'He/She';
      default:
        return 'He/She';
    }
  }

  private _getWhos(gender: Gender): string {
    switch (gender) {
      case Gender.MALE:
        return 'His';
      case Gender.FEMALE:
        return 'Her';
      case Gender.OTHER:
        return 'His/Her';
      default:
        return 'His/Her';
    }
  }

  private _getClothes(rpgVocation: RPGVocation) {
    switch (rpgVocation) {
      case RPGVocation.KNIGHT:
        return 'Armor';
      case RPGVocation.RANGER:
        return 'Leather armor';
      case RPGVocation.ROGUE:
        return 'Light armor';
      case RPGVocation.WIZARD:
        return 'Light robes';
      default:
        return 'Light armor';
    }
  }

  private _getBackground(rpgVocation: RPGVocation) {
    switch (rpgVocation) {
      case RPGVocation.KNIGHT:
        return 'anime crimson swords, warcry enchantment spells';
      case RPGVocation.RANGER:
        return 'anime bow arrows, nautre enchantment spells';
      case RPGVocation.ROGUE:
        return 'anime crimson daggers, shaped in pentagram circle with arcane magic';
      case RPGVocation.WIZARD:
        return 'anime arcane spells, magic circle';
      default:
        return 'anime arcane spells, magic circle';
    }
  }
}
