import { Injectable } from '@nestjs/common';
import { Gender, GenPayloadDto, RPGClass } from './dto';

@Injectable()
export class PromptConstructionService {
  constructor() {}

  public constructFantasyWorldRPGPrompt({
    rpgClass,
    eyeColor,
    facialHair,
    gender,
    hairColor,
    hairLength,
    skinTone,
  }: GenPayloadDto): string {
    let prompt = `A ${gender !== Gender.OTHER ? gender : ''} ${rpgClass} from a fantasy RPG world, depicted in an anime style. `;

    prompt += `${this._getWho(gender)} has ${hairLength} ${hairColor} hair, ${eyeColor} eyes, and ${this._getWhos(gender)} face is clearly visible. `;
    prompt += `${this._getWho(gender)} is wearing ${this._getClothes(rpgClass)}, practical clothing, ready for action. `;
    prompt += `${this._getWhos(gender)} skin tone is somewhat close to ${skinTone}. `;
    prompt += `${gender === Gender.MALE ? `He has ${facialHair} facial hair (beard)` : ''}. `;
    prompt += `The background features depiction of ${this._getBackground(rpgClass)}.`;
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

  private _getClothes(rpgClass: RPGClass) {
    switch (rpgClass) {
      case RPGClass.WARRIOR:
        return 'Armor';
      case RPGClass.RANGER:
        return 'Leather armor';
      case RPGClass.ROGUE:
        return 'Light armor';
      case RPGClass.WIZARD:
        return 'Light robes';
      default:
        return 'Light armor';
    }
  }

  private _getBackground(rpgClass: RPGClass) {
    switch (rpgClass) {
      case RPGClass.WARRIOR:
        return 'crimson swords, warcry enchantment spells';
      case RPGClass.RANGER:
        return 'bow arrows, nautre enchantment spells';
      case RPGClass.ROGUE:
        return 'crimson daggers, shadow enchantment spells';
      case RPGClass.WIZARD:
        return 'arcane spells, magic circle';
      default:
        return 'arcane spells, magic circle';
    }
  }
}
