//@ts-ignore
import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { GenericController } from "../../_generic-module/generic.controller";
import { Message } from "./message.model";
import {  MessagerService } from "./message.service";
//@ts-ignore
import { Request, Response } from 'express';
import { AttachmentService } from "../../attachments/attachment.service";
import { IMessage } from "./message.interface";
import { ConversationService } from "../conversation/conversation.service";
import omit from "../../../shared/omit";
import pick from "../../../shared/pick";
import { Conversation } from "../conversation/conversation.model";
import { ConversationParticipents } from "../conversationParticipents/conversationParticipents.model";
import { TFolderName } from "../../../enums/folderNames";
// Import the io instance from your socket setup

// Adjust the path as needed to where your io instance is exported


const attachmentService = new AttachmentService();
const conversationService = new ConversationService();

export class MessageController extends GenericController<typeof Message, IMessage> {
    messageService = new MessagerService();
    constructor(){
        super(new MessagerService(), "Message")
    }

    //---------------------------------
    // we need this to create a message with attachments
    // or just to upload attachments in chat 
    //---------------------------------

    create = catchAsync(async (req: Request, res: Response) => {
        // const data = req.body;


        // Get chat details
        const {conversationData, conversationParticipants} = await getConversationById(req.body.conversationId);
          

        if(conversationData.canConversate === false){
            return sendResponse(res, {
                code: StatusCodes.BAD_REQUEST,
                message: `You cannot send message in this conversation`,
                success: false,
            });
        }
        
        let attachments = [];
    
        if (req.files && req.files.attachments) {
          attachments.push(
            ...(await Promise.all(
            req.files.attachments.map(async file => {
              const attachmenId = await attachmentService.uploadSingleAttachment(
                  file, // file to upload 
                  TFolderName.conversation, // folderName
                  // req.user.userId, // uploadedByUserId
                  // TAttachedToType.site
                );
              return attachmenId;
              })
            ))
          );

          if(!req.body.text){
            req.body.text = `${attachments.length} attachments uploaded`;
          }
        }
    
        req.body.attachments = attachments;
        req.body.senderId = req.user.userId; // Set the senderId from the authenticated user


        const result : IMessage = await Message.create(req.body);

        //---------------------------------
        //  TODO : event emitter er maddhome message create korar por
        // conversation er lastMessage update korte hobe ..
        //---------------------------------

        const updatedConversation = await Conversation.findByIdAndUpdate(result.conversationId, {
        lastMessage: result._id,
        });

        //---------------------------------
        // As per sayed vais suggestion, we will emit the event to the specific conversation room
        // as when a user send attachments via chat, we need to notify all the participants of that conversation
        //---------------------------------

        const eventName = `new-message-received::${result.conversationId.toString()}`;
      
        //@ts-ignore
        io.to(result.conversationId.toString()).emit(eventName, {
            message: result,
        });

        //---------------------------------
        // We also need to emit to participants personal room
        // to update their conversation list .. 
        //---------------------------------

        conversationParticipants.forEach((participant: any) => {
          const participantId = participant.userId?.toString();
          
          console.log(`1️⃣ .forEach Participant ID: ${participantId}, User ID: ${req.user.userId}`);
          
          // Skip the sender if excludeUserId is provided
          if (req.user.userId && participantId == req.user.userId) {
            return;
          }

          // @ts-ignore
          // Check if participant is online
          if (global.socketUtils.getOnlineUsers().some(id => id.toString() === participantId)) {

            //@ts-ignore
            // Emit to participant's personal room  .to(participantId)
            io.emit(`conversation-list-updated::${participantId}`, {
              creatorId : updatedConversation?.creatorId,
              type: updatedConversation?.type,
              siteId: updatedConversation?.siteId,
              canConversate: updatedConversation?.canConversate,
              lastMessage: {
                _id: result._id,
                text: result.text,
                senderId: req.user.userId,
                conversationId: result.conversationId,
              },
              isDeleted: false,
              createdAt: "2025-07-19T12:06:00.287Z",
              _conversationId: updatedConversation?._id,
            });
            
          }else{
            // .... TODO: push notification .. Suggested by Abu Bokor Vai ..
          }
        });


        sendResponse(res, {
          code: StatusCodes.OK,
          data: result,
          message: `${this.modelName} created successfully`,
          success: true,
        });
      });

    getAllWithPagination = catchAsync(async (req: Request, res: Response) => {
        //const filters = pick(req.query, ['_id', 'title']); // now this comes from middleware in router
        const filters =  omit(req.query, ['sortBy', 'limit', 'page', 'populate']); ;
        const options = pick(req.query, ['sortBy', 'limit', 'page', 'populate']);

         const populateOptions: (string | {path: string, select: string}[]) = [
            {
              path: 'senderId',
              select: 'name role profileImage' // name 
            },
            {
              path: 'conversationId',
              select: 'canConversate siteId' // name 
            },
            {
              path: 'attachments',
              select: 'attachment'
            }
          ];


        let select = ''; // Specify fields to exclude from the result
        // -createdAt
        const result = await this.service.getAllWithPagination(filters, options,populateOptions, select);

        sendResponse(res, {
        code: StatusCodes.OK,
        data: result,
        message: `All ${this.modelName} with pagination`,
        success: true,
        });
    });

    // 🟢 i think we dont need this .. because we need pagination in this case .. and pagination 
    // is already implemented ..  
    getAllMessageByConversationId = catchAsync(
        async (req: Request, res: Response) => {
            const { conversationId } = req.query;
            if (!conversationId) {
                return sendResponse(res, {
                    code: StatusCodes.BAD_REQUEST,
                    message: "Conversation ID is required",
                    success: false,
                });
            }

            const result = await this.messageService.getAllByConversationId(
                conversationId.toString()
            );

            sendResponse(res, {
                code: StatusCodes.OK,
                data: result,
                message: `${this.modelName} fetched successfully`,
                success: true,
            });
        }
    );

    // add more methods here if needed or override the existing ones    
}

async function getConversationById(conversationId: string) {
  try {
    const conversationData = await Conversation.findById(conversationId)//.populate('users').exec();  // FIXME: user populate korar bishoy ta 
    // FIXME : check korte hobe  
    
    const conversationParticipants = await ConversationParticipents.find({
      conversationId: conversationId
    });

    if (!conversationData) {
      throw new Error(`Conversation with ID ${conversationId} not found`);
    }
    return { 
      conversationData: conversationData,
      conversationParticipants: conversationParticipants
    };
  } catch (error) {
    console.error('Error fetching chat:', error);
    throw error;
  }
}