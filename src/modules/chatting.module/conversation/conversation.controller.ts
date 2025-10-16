//@ts-ignore
import { Request, Response } from 'express';
import catchAsync from '../../../shared/catchAsync';
import sendResponse from '../../../shared/sendResponse';
import { GenericController } from '../../_generic-module/generic.controller';
import { Conversation } from './conversation.model';
import { ConversationService } from './conversation.service';
//@ts-ignore
import { StatusCodes } from 'http-status-codes';
import { ConversationParticipentsService } from '../conversationParticipents/conversationParticipents.service';
import ApiError from '../../../errors/ApiError';
import { IConversation } from './conversation.interface';
import { ConversationType, TParticipants } from './conversation.constant';
import { MessagerService } from '../message/message.service';
import { IMessage } from '../message/message.interface';
import { User } from '../../user.module/user/user.model';
import omit from '../../../shared/omit';
import pick from '../../../shared/pick';
//@ts-ignore
import { populate } from 'dotenv';
//@ts-ignore
import mongoose from 'mongoose';
import { ConversationParticipents } from '../conversationParticipents/conversationParticipents.model';
import { IConversationParticipents } from '../conversationParticipents/conversationParticipents.interface';

let conversationParticipantsService = new ConversationParticipentsService();
let messageService = new MessagerService();

export class ConversationController extends GenericController<typeof Conversation, IConversation> {
  conversationService = new ConversationService();

  constructor() {
    super(new ConversationService(), 'Conversation');
  }

  // override // 1️⃣
  getAllWithPagination = catchAsync(async (req: Request, res: Response) => {
    //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
    const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
    const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

    const populateOptions: (string | {path: string, select: string}[]) = [
      // {
      //   path: 'personId',
      //   select: 'name role' // name 
      // },
      // 'personId'
      
    ];

    let dontWantToInclude = '-groupName -groupProfilePicture -groupBio -groupAdmins -blockedUsers -deletedFor -isDeleted -updatedAt -createdAt -__v'; // Specify fields to exclude from the result
    
    const result = await this.service.getAllWithPagination(filters, options,populateOptions,dontWantToInclude);

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: `All ${this.modelName} with pagination`,
      success: true,
    });
  });

  //---------------------------------
  // ( Dashboard ) | Admin :: getAllConversationAndItsParticipantsBySiteId
  //---------------------------------
  getAllConversationAndItsParticipantsBySiteId = catchAsync(
    async (req: Request, res: Response) => {
      const { siteId } = req.query;

      const conversations = await Conversation.find({
        siteId: siteId,
        isDeleted: false, 
      }).select('-__v -type -updatedAt -lastMessage -deletedFor -groupAdmins -blockedUsers -groupBio -groupProfilePicture -groupName').populate(
        {
          path: 'siteId',
          select: 'name'
        }
      )

      // now we have to get all participants of each conversation

      const conversationsWithParticipants = await Promise.all(
        conversations.map(async (conversation) => {
          const participants = await conversationParticipantsService.getByConversationIdForAdminDashboard(
            conversation._id
          );
          
          return {
            ...conversation.toObject(),
            participants,
          };
        })
      );

      sendResponse(res, {
        code: StatusCodes.OK,
        data: conversationsWithParticipants,
        message: `All conversations with participants for siteId: ${siteId}`,
        success: true,
      });
    }
  );


  //---------------------------------
  // Claude 
  //---------------------------------
  create = catchAsync(async (req: Request, res: Response) => {
    let type;
    let result: IConversation;
    
    let { participants, message } = req.body;

    if (!participants || participants.length === 0) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        'Without participants you can not create a conversation'
      );
    }

    // Add yourself to the participants list
    participants = [...participants, req.user.userId];
    
    // Remove duplicates in case user included themselves
    participants = [...new Set(participants.map(p => p.toString()))];

    // Determine conversation type
    type = participants.length > 2 ? ConversationType.group : ConversationType.direct;

    const conversationData: IConversation = {
      creatorId: req.user.userId,
      type,
    };

    // ✅ FIXED: Check if conversation exists with SAME PARTICIPANTS
    let existingConversation = null;
    
    if (type === ConversationType.direct) {
      // For direct conversations, find conversations where exactly these 2 participants exist
      const conversationsWithParticipants = await ConversationParticipents.aggregate([
        {
          $match: {
            userId: { $in: participants.map(p => new mongoose.Types.ObjectId(p)) },
            isDeleted: false
          }
        },
        {
          $group: {
            _id: "$conversationId",
            participantCount: { $sum: 1 },
            participantIds: { $push: "$userId" }
          }
        },
        {
          $match: {
            participantCount: participants.length // Exact participant count
          }
        }
      ]);

      if (conversationsWithParticipants.length > 0) {
        for (const conv of conversationsWithParticipants) {
          // Check if participant IDs match exactly
          const existingIds = conv.participantIds.map(id => id.toString()).sort();
          const newIds = participants.map(p => p.toString()).sort();
          
          if (JSON.stringify(existingIds) === JSON.stringify(newIds)) {
            // Found exact match, get the conversation
            existingConversation = await Conversation.findOne({
              _id: conv._id,
              type: ConversationType.direct,
              isDeleted: false
            }).select('-isDeleted -updatedAt -createdAt -__v');
            break;
          }
        }
      }
    } else {
      // For group conversations, you might want different logic
      // Option 1: Always create new groups (most common)
      // Option 2: Check for groups with same participants and same creator
      // For now, let's always create new groups
      existingConversation = null;
      
      // Uncomment below if you want to prevent duplicate groups with same participants
      /*
      const conversationsWithParticipants = await ConversationParticipant.aggregate([
        {
          $match: {
            userId: { $in: participants.map(p => new mongoose.Types.ObjectId(p)) },
            isDeleted: false
          }
        },
        {
          $group: {
            _id: "$conversationId",
            participantCount: { $sum: 1 },
            participantIds: { $push: "$userId" }
          }
        },
        {
          $match: {
            participantCount: participants.length
          }
        }
      ]);

      if (conversationsWithParticipants.length > 0) {
        for (const conv of conversationsWithParticipants) {
          const existingIds = conv.participantIds.map(id => id.toString()).sort();
          const newIds = participants.map(p => p.toString()).sort();
          
          if (JSON.stringify(existingIds) === JSON.stringify(newIds)) {
            existingConversation = await Conversation.findOne({
              _id: conv._id,
              type: ConversationType.group,
              siteId: req.body.siteId,
              creatorId: req.user.userId, // Same creator
              isDeleted: false
            }).select('-isDeleted -updatedAt -createdAt -__v');
            break;
          }
        }
      }
      */
    }

    if (!existingConversation) {
      //---------------------------------
      // Create a new conversation
      //---------------------------------
      
      result = await this.service.create(conversationData);

      if (!result) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'Unable to create conversation'
        );
      }

      // Add participants
      for (const participant of participants) {
        const user = await User.findById(participant).select('role');

        if (!user) {
          throw new ApiError(
            StatusCodes.NOT_FOUND,
            `User with id ${participant} not found`
          );
        }

        const participantResult: IConversationParticipents =
          await conversationParticipantsService.create({
            userId: participant,
            conversationId: result._id,
            role: user.role === TParticipants.admin ? TParticipants.admin : TParticipants.member,
            joinedAt: new Date(),
            // joinedAt will be set automatically by schema default
          });

        if (!participantResult) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            'Unable to create conversation participant'
          );
        }
      }

      // Add initial message if provided
      if (message && result._id) {
        const messageResult: IMessage | null = await messageService.create({
          text: message,
          senderId: req.user.userId,
          conversationId: result._id,
        });
        
        if (!messageResult) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            'Unable to create initial message'
          );
        }

        // Update lastMessage in conversation
        await Conversation.findByIdAndUpdate(result._id, {
          lastMessage: messageResult._id
        });
      }

    } else {
      // Conversation exists, just add message if provided
      result = existingConversation;
      
      if (message && existingConversation._id && existingConversation.canConversate) {
        const messageResult: IMessage | null = await messageService.create({
          text: message,
          senderId: req.user.userId,
          conversationId: existingConversation._id,
        });
        
        if (!messageResult) {
          throw new ApiError(
            StatusCodes.BAD_REQUEST,
            'Unable to send message'
          );
        }

        // Update lastMessage in conversation
        await Conversation.findByIdAndUpdate(existingConversation._id, {
          lastMessage: messageResult._id
        });
      }
    }

    sendResponse(res, {
      code: StatusCodes.OK,
      data: result,
      message: existingConversation 
        ? `Conversation already exists` 
        : `${this.modelName} created successfully`,
      success: true,
    });
  });


  addParticipantsToExistingConversation = catchAsync(
    async (req: Request, res: Response) => {
      
      const {
        participants,
        conversationId,
      }: { participants: string[]; conversationId: string } = req.body;

      const conversation = await this.service.getById(conversationId);
      if (!conversation) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Conversation not found');
      }
      let result;
      // console.log('') // for testing .. 

      if (participants.length > 0) {
        for (const participantId of participants) {
          if (participantId !== req.user.userId) {
            const existingParticipant =
            await conversationParticipantsService.getByUserIdAndConversationId(
              participantId,
              conversationId
            );
              
            // console.log(
            //   'existingParticipant 🧪🧪',
            //   existingParticipant,
            //   existingParticipant.length
            // );

            if (existingParticipant.length == 0) {
              await conversationParticipantsService.create({
                userId: participantId,
                conversationId: conversation?._id,
                role: req.user.role === TParticipants.admin ? TParticipants.admin : TParticipants.member,
                joinedAt: new Date(),
              });

              sendResponse(res, {
                code: StatusCodes.OK,
                data: null,
                message: `Participents ${participantId}  added successfully  ${this.modelName}.. ${conversationId}`,
                success: true,
              });
            }
            sendResponse(res, {
              code: StatusCodes.OK,
              data: null,
              message: `Participents ${participantId} can not be added  ${this.modelName}.. ${conversationId}`,
              success: true,
            });
          }
        }

      }
    }
  );

  showParticipantsOfExistingConversation = catchAsync(
    async (req: Request, res: Response) => {
      const { conversationId } = req.query;

      if (!conversationId) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'Without conversationId you can not show participants'
        );
      }

      const conversation = await this.service.getById(conversationId);
      if (!conversation) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Conversation not found');
      }

      const res1 = await conversationParticipantsService.getByConversationId(
        conversationId
      );

      if (!res1) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'no participants found in this conversation'
        );
      }

      // 🔥🔥 Multiple er jonno o handle korte hobe .. single er jonno o handle korte hobe ..
      sendResponse(res, {
        code: StatusCodes.OK,
        data: res1,
        message: `Participents found successfully to this ${this.modelName}.. ${conversationId}`,
        success: true,
      });
    }
  );

  removeParticipantFromAConversation = catchAsync(
    async (req: Request, res: Response) => {
      const { conversationId, participantId } = req.body;

      if (!conversationId || !participantId) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'Without conversationId and participantId you can not remove participants'
        );
      }

      const conversation = await this.service.getById(conversationId);
      if (!conversation) {
        throw new ApiError(StatusCodes.NOT_FOUND, 'Conversation not found');
      }

      const res1 =
        await conversationParticipantsService.getByUserIdAndConversationId(
          participantId,
          conversationId
        );

      if (!res1) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'no participants found in this conversation'
        );
      }

      const result = await conversationParticipantsService.deleteById(
        res1[0]._id
      );

      if (!result) {
        throw new ApiError(
          StatusCodes.BAD_REQUEST,
          'Unable to remove participant from the conversation.'
        );
      }

      sendResponse(res, {
        code: StatusCodes.OK,
        data: null,
        message: `Participant removed successfully from this ${this.modelName}.. ${conversationId}`,
        success: true,
      });
    }
  );

  // add more methods here if needed or override the existing ones
}