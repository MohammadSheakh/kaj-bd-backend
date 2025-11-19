import { GenericService } from "../../_generic-module/generic.services";
import { IConversation } from "./conversation.interface";
import { Conversation } from "./conversation.model";
import ApiError from "../../../errors/ApiError";
//@ts-ignore
import { StatusCodes } from "http-status-codes";

export class ConversationService extends GenericService<typeof Conversation , IConversation>{
    constructor(){
        super(Conversation)
    }

    async updateLastMessageOfAConversation(conversationId: String, lastMessage : String){
        if(!conversationId){
            throw new ApiError(StatusCodes.BAD_REQUEST, 'ConversationId is not found');
        }
        if(!lastMessage){
            throw new ApiError(StatusCodes.BAD_REQUEST, 'LastMessage is not found');
        }
        
        return await this.model.findOneAndUpdate(
            { _id: conversationId },
            { lastMessage: lastMessage },
            { new: true }
        );
    }
    
}