//@ts-ignore
import { model, Schema } from 'mongoose';
import { TApprovalStatus } from './userProfile.constant';
import { IUserProfile, IUserProfileModel } from './userProfile.interface';

const userProfileSchema = new Schema<IUserProfile>({
    attachments: [ // for specialist and doctor 
        {
            type: Schema.Types.ObjectId,
            ref: 'Attachment',
            required: [false, 'Attachments is not required'],
        }
    ],
    approvalStatus: { /** admin can approve this status ..  */
        type: String,
        enum: [
            TApprovalStatus.pending,
            TApprovalStatus.approved,
            TApprovalStatus.rejected
        ],
        default: TApprovalStatus.pending,
    },
    protocolNames : [ // for specialist
        {
            type: String,
            required: [false, 'Protocol name is not required'],
        }
    ],
    howManyPrograms:{ // for specialist
        type: Number,
        required: [false, 'How many programs is not required'],
        default: 0
    },
    // TODO : need to test .. while create patient .. is this initiate ?
    howManyProtocol:{ // for patient
        type: Number,
        required: [false, 'How many programs is not required'],
        default: 0
    },
    userId: { //🔗 for back reference .. 
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
    description: {
        type: String,
        required: [false, 'Description is not required'],
    },
    address: {
        type: String,
        required: [false, 'Address is not required'],
    }
});

export const UserProfile = model<IUserProfile, IUserProfileModel>('UserProfile', userProfileSchema);
