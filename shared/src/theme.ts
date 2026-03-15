export type ThemeCategory =
  | 'ИСТОРИЯ'
  | 'НАУКА'
  | 'КУЛЬТУРА'
  | 'СПОРТ'
  | 'ГЕОГРАФИЯ'
  | 'ТЕХНОЛОГИИ'
  | 'ВИДЕОИГРЫ'
  | 'МИФОЛОГИЯ'
  | 'ЕДА'
  | 'МУЗЫКА'
  | 'КИНО'
  | 'ПУТЕШЕСТВИЯ'
  | 'БИЗНЕС'
  | 'ИНТЕРНЕТ'
  | 'АВТОМОБИЛИ'
  | 'ЖИВОТНЫЕ'
  | 'ЛЮДИ И СТРАНЫ'
  | 'ПРАЗДНИКИ МИРА'
  | 'РАСТЕНИЯ';

export interface ThemeWithAccess {
  id: string;
  name: string;
  category: ThemeCategory;
  isFree: boolean;
  isPurchased: boolean;
  questions?: QuestionPublic[];
}

export interface QuestionPublic {
  id: string;
  points: number;
  text: string;
}

export interface QuestionFull extends QuestionPublic {
  answer: string;
  themeId: string;
}

export interface Purchase {
  id: string;
  userId: string;
  themeId: string;
  stripeId: string;
  createdAt: string;
}
