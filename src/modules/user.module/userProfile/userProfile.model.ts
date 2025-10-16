import { model, Schema } from 'mongoose';
import {  TGender } from './userProfile.constant';
import { IUserProfile, IUserProfileModel } from './userProfile.interface';

const userProfileSchema = new Schema<IUserProfile>({
    frontSideCertificateImage: [ // 
        {
            type: Schema.Types.ObjectId,
            ref: 'Attachment',
            required: [true, 'Attachments is not required'],
        }
    ],
    backSideCertificateImage: [ // 
        {
            type: Schema.Types.ObjectId,
            ref: 'Attachment',
            required: [true, 'Attachments is not required'],
        }
    ],
    faceImageFromFrontCam: [ // 
        {
            type: Schema.Types.ObjectId,
            ref: 'Attachment',
            required: [true, 'Attachments is not required'],
        }
    ],
    gender: {
        type: String,
        enum: [
            TGender.male,
            TGender.female,
        ],
        required: [true, 'Gender is required'],
        default: TGender.male,
    },
    acceptTOC:{ // for specialist
        type: Boolean,
        required: [true, 'acceptTOC is required'],
    },
    userId: { //🔗 for back reference .. 
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
});

export const UserProfile = model<IUserProfile, IUserProfileModel>('UserProfile', userProfileSchema);
