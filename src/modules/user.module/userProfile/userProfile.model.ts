//@ts-ignore
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
    dob: {
        type: Date,
        required: [false, 'Dob is not required'],
    },
    gender: {
        type: String,
        enum: [
            TGender.male,
            TGender.female,
        ],
        required: [false, 'Gender is not required'],
        default: TGender.male,
    },
    acceptTOC:{ // for specialist
        type: Boolean,
        required: [false, 'acceptTOC is not required'],
    },
    location: {
        bn: {
            type: String,
            required: false,
        },
        en: {
            type: String,
            required: false,
        }
    },
    /*----------------------------------
     * 
     * this lat lng .. is not enough because client want to search based on providers location ..
     * so we need to have a geojson structure to perform geospatial queries ..
     * however to avoid breaking changes for flutter devs UI .. we are keeping this lat lng structure ..
     * 
     * 
     * for geospatial queries we will create another collection in database .. which contains
     * only location related information of provider and user .. 
     * 
     ------------------------------------*/
    lat: {
        type: Number,
        required: false,
    },
    lng: {
        type: Number,
        required: false,
    },

    // as per client requirement we add this .. also keep the previous lat lng structure so that
    // Flutter devs UI does not break .. 
    // locationV2: {
    //     type: {
    //         type: String,
    //         enum: ["Point"],
    //         default: "Point"
    //     },
    //     coordinates: {
    //         type: [Number],
    //         validate: {
    //         validator: function (v) {
    //             // allow null but if present must be exactly 2 numbers
    //             return v == null || v.length === 2;
    //         },
    //         message: "Coordinates must be an array of two numbers [lng, lat]"
    //         },
    //         default: undefined
    //     }
    // },

    userId: { //🔗 for back reference .. 
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
});

// userProfileSchema.index({ locationV2: "2dsphere" });

export const UserProfile = model<IUserProfile, IUserProfileModel>('UserProfile', userProfileSchema);