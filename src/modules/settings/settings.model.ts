//@ts-ignore
import { model, Schema } from 'mongoose';
import { ISettings } from './settings.interface';
import { settingsType } from './settings.constant';

const settingsSchema = new Schema<ISettings>(
  {
    type: {
      type: String,
      enum: [
        settingsType.aboutUs,
        settingsType.contactUs,
        settingsType.privacyPolicy,
        settingsType.termsAndConditions,
        settingsType.introductionVideo,
      ],
      required: [true, `type is required .. it can be  ${Object.values(settingsType).join(
              ', '
            )}`],
    },
    details: {
      type: String,
      required: false,
    },
    introductionVideo:{
      type: Object,
      required: false, // This is optional
    }
  },
  {
    timestamps: true,
  }
);

export const Settings = model<ISettings>('Settings', settingsSchema);
