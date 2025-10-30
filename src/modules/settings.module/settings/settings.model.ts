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
      ],
      required: [true, `type is required .. it can be  ${Object.values(settingsType).join(
              ', '
            )}`],
    },
    details: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export const Settings = model<ISettings>('Settings', settingsSchema);
