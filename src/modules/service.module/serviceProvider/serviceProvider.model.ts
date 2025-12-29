//@ts-ignore
import { model, Schema } from 'mongoose';
import { IServiceProvider, IServiceProviderModel } from './serviceProvider.interface';
import paginate from '../../../common/plugins/paginate';
import { TProviderApprovalStatus } from '../../user.module/userRoleData/userRoleData.constant';

//-----------------------------
// ServiceProvider means Service Provider Details
//-----------------------------
const ServiceProviderSchema = new Schema<IServiceProvider>(
  {
    
    providerId: { //🔗 who provide this service
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Provider ID is required'],
    },
    locationId: { //🔗 who provide this service
      type: Schema.Types.ObjectId,
      ref: 'Location',
      required: [false, 'Provider ID is required'],
    },
    serviceName: {
      en: { 
        type: String, 
        required: [true, 'English serviceName is required'], 
        trim: true 
      },
      bn: { 
        type: String, 
        required: [true, 'Bangla serviceName is required'], 
        trim: true 
      }
    },
    serviceCategoryId: { // 🔗 this is workType 
      type: Schema.Types.ObjectId,
      ref: 'ServiceCategory',
      required: [true, 'Service category is required'],
    },
    startPrice: {
      type: Number,
      required: [true, 'Start price is required'],
      min: [0, 'Star price cannot be negative'],
    },
    rating: {
      type: Number,
      default: 0,
      min: [0, 'Rating cannot be less than 0'],
      max: [5, 'Rating cannot exceed 5'],
    },
    introOrBio: {
      // type: String,
      // maxlength: [500, 'Intro/Bio cannot exceed 500 characters'],
      en: { 
        type: String, 
        required: [false, 'English Intro/Bio is not required'], 
        default : "",
        trim: true 
      },
      bn: { 
        type: String, 
        required: [false, 'Bangla Intro/Bio is not required'], 
        default : "",
        trim: true 
      }
    },
    description: {
      // type: String,
      // maxlength: [2000, 'Description cannot exceed 2000 characters'],
      en: { 
        type: String, 
        required: [false, 'English description is not required'], 
        default : "",
        trim: true 
      },
      bn: {
        type: String, 
        required: [false, 'Bangla description is not required'], 
        default : "",
        trim: true 
      }
    },
    attachmentsForGallery: [//🔗🖼️ first image is shown as coverPhoto .. rest of the images are for gallery
      {
        type: Schema.Types.ObjectId,
        ref: 'Attachment',
        required: [false, 'attachments is not required'],
      }
    ],
    attachmentsForCoverPhoto: [//🔗🖼️ may be later we need this .. but UI is not design for this 
      {
        type: Schema.Types.ObjectId,
        ref: 'Attachment',
        required: [false, 'attachments is not required'],
      }
    ],
    nidNumber: {
      type: String,
      required: [false, 'nidNumber is not required'],
    },
    yearsOfExperience: {
      type: Number,
      required: [true, 'Years of experience is required'],
      min: [0, 'Years of experience cannot be negative'],
    },

    //--------------------------------
    // actually its from userRoleData .. but for better query we keep this here also
    //---------------------------------
    providerApprovalStatus: {
      type: String,
      enum: [
        TProviderApprovalStatus.accept,
        TProviderApprovalStatus.reject,
        TProviderApprovalStatus.pending,
      ],
      default: TProviderApprovalStatus.pending,
    },

    
  
    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);

ServiceProviderSchema.plugin(paginate);

ServiceProviderSchema.pre('save', function (next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee

  next();
});

// Use transform to rename _id to _projectId
ServiceProviderSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._ServiceProviderId = ret._id; // Rename _id to _subscriptionId
    delete ret._id; // Remove the original _id field
    return ret;
  },
});

//-----------------------------
// ServiceProvider means Service Provider Details
//-----------------------------
export const ServiceProvider = model<
  IServiceProvider,
  IServiceProviderModel
>('ServiceProvider', ServiceProviderSchema);
