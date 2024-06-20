export class GenImgDto {
  epochId: string;
  sessionUUID: string;
  payload: GenPayloadDto;
}

export enum RPGVocation {
  KNIGHT = 'KNIGHT',
  WIZARD = 'WIZARD',
  ROGUE = 'ROGUE',
  RANGER = 'RANGER',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other/prefer not to say',
}

export enum SkinTone {
  VERY_LIGHT = 'very light',
  LIGHT = 'light',
  LIGHT_MEDIUM = 'light medium',
  MEDIUM = 'medium',
  MEDIUM_DARK = 'medium dark',
  DARK = 'dark',
  VERY_DARK = 'very dark',
  DEEP = 'deep',
}

export enum SkinToneHEX {
  VERY_LIGHT = '#FFDFC4',
  LIGHT = '#F0D5B1',
  LIGHT_MEDIUM = '#EECEB3',
  MEDIUM = '#E1B899',
  MEDIUM_DARK = '#CC9D76',
  DARK = '#A57257',
  VERY_DARK = '#784232',
  DEEP = '#603E30',
}

export enum HairColor {
  BLACK = 'black',
  DARK_BROWN = 'dark brown',
  BROWN = 'brown',
  LIGHT_BROWN = 'light brown',
  FAIR = 'fair',
  BLONDE = 'blonde',
  DIRTY_BLONDE = 'dirty blonde',
  RED = 'red',
  GRAY = 'gray',
  WHITE = 'white',
}

export enum HairColorHEX {
  BLACK = '#000000',
  DARK_BROWN = '#4B3621',
  BROWN = '#8B4513',
  LIGHT_BROWN = '#A52A2A',
  FAIR = '#FAE7B5',
  BLONDE = '#FFD700',
  DIRTY_BLONDE = '#D2B48C',
  RED = '#FF4500',
  GRAY = '#808080',
  WHITE = '#FFFFFF',
}

export enum HairLength {
  SHORT = 'short',
  MEDIUM = 'medium',
  LONG = 'long',
}

export enum EyeColor {
  DARK_BROWN = 'dark brown',
  BROWN = 'brown',
  HAZEL = 'hazel',
  AMBER = 'amber',
  GREEN = 'green',
  BLUE = 'blue',
  GRAY = 'gray',
  LIGHT_BLUE = 'light blue',
  VIOLET = 'violet',
}

export enum EyeColorHEX {
  DARK_BROWN = '#4B3621',
  BROWN = '#8B4513',
  HAZEL = '#8E7618',
  AMBER = '#BF7F34',
  GREEN = '#3B7A57',
  BLUE = '#1C86EE',
  GRAY = '#A0A0A0',
  LIGHT_BLUE = '#ADD8E6',
  VIOLET = '#EE82EE',
}

export enum FacialHair {
  NO = 'no',
  SHORT = 'short',
  MEDIUM = 'medium',
  LONG = 'long',
}

export default HairColor;

export class GenPayloadDto {
  rpgVocation: RPGVocation;
  gender?: Gender;
  skinTone?: SkinTone;
  hairColor?: HairColor;
  hairLength?: HairLength;
  facialHair?: FacialHair;
  eyeColor?: EyeColor;
}
