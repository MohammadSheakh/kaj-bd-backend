import { settingsType } from './settings.constant';

export interface ISettings {
  _id: string;
  type:
    | settingsType.aboutUs
    | settingsType.contactUs
    | settingsType.privacyPolicy
    | settingsType.termsAndConditions
    | settingsType.introductionVideo;
  details: string;
  introductionVideo: Object; 
  createdAt: Date;
  updatedAt: Date;
}
