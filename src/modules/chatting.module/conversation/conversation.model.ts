//@ts-ignore
import { model, Schema } from 'mongoose';
import paginate from '../../../common/plugins/paginate';
import { IConversation, IConversationModel } from './conversation.interface';
import { ConversationType } from './conversation.constant';

const conversationSchema = new Schema<IConversation>(
  {
    creatorId: { //🔗
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User Id is required'],
    },
    type: {
      type: String,
      enum: [
        ConversationType.direct,
        ConversationType.group,
      ],
      required: [
        true,
        `ConversationType is required it can be ${Object.values(
          ConversationType
        ).join(', ')}`,
      ],
    },
  
    groupName: {
      type: String,
      default: null, // Optional group name
    },
    groupProfilePicture: {
      type: String,
      default: null, // Optional group profile picture
    },
    lastMessageId : { //🔗
      type: Schema.Types.ObjectId,
      ref: 'Message',
      default: null, // Optional last message reference
    },
    lastMessage : {
      type: String,
      default: null, 
    },
    lastMessageCreatedAt: {
      type: Date,
      required: [false, 'lastMessageCreatedAt is required'],
    },
    /***********
    groupBio: {
      type: String,
      default: null, // Optional group bio
    },
    groupAdmins: {
      type: [Schema.Types.ObjectId],
      default: [],
      ref: 'User', // Reference to User model
    },
    unreadCountes: {
      type: Object, // Dynamic structure for unread counts
      default: {}, // Initialize as an empty object
    },
    blockedUsers: {
      type: [Schema.Types.ObjectId], // Users who are blocked
      default: [],
      ref: 'User',
    },
    
    deletedFor: {
      type: [Schema.Types.ObjectId], // Users who have deleted the chat
      default: [],
      ref: 'User',
    },
    ********* */
    
    isDeleted: {
      type: Boolean,
      required: [false, 'isDeleted is not required'],
      default: false,
    },
  },
  { timestamps: true }
);

conversationSchema.plugin(paginate);

conversationSchema.pre('save', function(next) {
  // Rename _id to _projectId
  // this._taskId = this._id;
  // this._id = undefined;  // Remove the default _id field
  //this.renewalFee = this.initialFee
  
  next();
});


// Use transform to rename _id to _projectId
conversationSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret._conversationId = ret._id;  // Rename _id to _subscriptionId
    delete ret._id;  // Remove the original _id field
    return ret;
  }
});


export const Conversation = model<IConversation, IConversationModel>(
  'Conversation',
  conversationSchema
);
