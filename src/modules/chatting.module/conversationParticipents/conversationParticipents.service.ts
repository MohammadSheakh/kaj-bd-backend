import path from 'path';
import { GenericService } from '../../_generic-module/generic.services';
import { IConversationParticipents } from './conversationParticipents.interface';
import { ConversationParticipents } from './conversationParticipents.model';
import { PaginateOptions } from '../../../types/paginate';

export class ConversationParticipentsService extends GenericService<
  typeof ConversationParticipents, IConversationParticipents
> {
  constructor() {
    super(ConversationParticipents);
  }

  async getByUserIdAndConversationId(userId: string, conversationId: string) {
    const object = await this.model.find({ userId , conversationId});
    
    if (!object) {
      // throw new ApiError(StatusCodes.BAD_REQUEST, 'No file uploaded');
      return null;
    }
    return object;
  }

  async getByConversationId(conversationId: any) {
    const object = await this.model.find({ conversationId });
    if (!object) {
      // throw new ApiError(StatusCodes.BAD_REQUEST, 'No file uploaded');
      return null;
    }
    return object;
  }

  //---------------------------------
  // ( Dashboard ) | Admin :: getAllConversationAndItsParticipantsBySiteId
  //---------------------------------
  async getByConversationIdForAdminDashboard(conversationId: any) {
    const object = await this.model.find({ conversationId }).select('-joinedAt -createdAt -updatedAt -__v')
    .populate({
      path: 'userId',
      select:'name role'
    });
    if (!object) {
      // throw new ApiError(StatusCodes.BAD_REQUEST, 'No file uploaded');
      return null;
    }
    return object;
  }

  /**********
   * 
   * Socket Helper Function
   * 
   * we need logged in users conversationsParticipents where we want to show only another person not logged in user  
   * For App ... 
   * 
   * ********** */
  async getAllConversationByUserId(userId: any) {
    let loggedInUserId = userId;
    // Step 1: Find all conversations the logged-in user participates in
    const userConversations = await ConversationParticipents.find({
      userId: loggedInUserId,
      isDeleted: false
    }).select('conversationId');

    const conversationIds = userConversations.map(conv => conv.conversationId);

    // Step 2: Find all participants in those conversations (excluding the logged-in user)
    const relatedParticipants = await ConversationParticipents.find({
      conversationId: { $in: conversationIds },
      userId: { $ne: loggedInUserId },
      isDeleted: false
    })
    .populate({
      path: 'userId',
      select: 'name profileImage role'
    })
    .populate({
      path: 'conversationId',
      select: 'lastMessage updatedAt',
      populate: {
        path: 'lastMessage',
      }
    });

    // Step 3: Remove duplicates and format data
    const uniqueUsers = {};
    
    relatedParticipants.forEach(participant => {
      const userId = participant.userId._id.toString();
      
      if (!uniqueUsers[userId]) {
        uniqueUsers[userId] = {
          userId: {
            _userId: participant.userId._id,
            name: participant.userId.name,
            profileImage: participant.userId.profileImage,
            role: participant.userId.role
          },
          conversations: [],
          // isOnline: global.socketUtils.isUserOnline(userId), // 😄😄😄😄😄😄😄 Not Working .. 
          // participantInfo: {
          //   joinedAt: participant.joinedAt,
          //   isDeleted: participant.isDeleted,
          //   _conversationParticipentsId: participant._id
          // }
        };
      }
      
      // Add conversation if not already added
      const conversationExists = uniqueUsers[userId].conversations.some(
        conv => conv._conversationId.toString() === participant.conversationId._id.toString()
      );
      
      if (!conversationExists) {
        uniqueUsers[userId].conversations.push({
          _conversationId: participant.conversationId._id,
          lastMessage: participant.conversationId.lastMessage,
          updatedAt: participant.conversationId.updatedAt
        });
      }
    });

    return Object.values(uniqueUsers);
  }

  ///// just add pagination functionality with above functionality ..  
  async getAllConversationByUserIdWithPagination(userId: any, options: PaginateOptions = { limit: 10, page: 1 }) {
    let loggedInUserId = userId;
    // Step 1: Find all conversations the logged-in user participates in
    const userConversations = await ConversationParticipents.find({
      userId: loggedInUserId,
      isDeleted: false
    }).select('conversationId');

    const conversationIds = userConversations.map(conv => conv.conversationId);

  // Step 2: Use pagination on ConversationParticipents
  const filter = {
    conversationId: { $in: conversationIds },
    userId: { $ne: loggedInUserId },
    isDeleted: false
  };

  const populateOptions = [
    {
      path: 'userId',
      select: 'name profileImage role'
    },
    {
      path: 'conversationId',
      select: 'lastMessage updatedAt',
      populate: {
        path: 'lastMessage',
      }
    }
  ];
  
  let dontWantToInclude: string | string[] = '';

  // Use your pagination function
  const paginatedResults = await ConversationParticipents.paginate(
    filter,
    {
      ...options, 
      sortBy: options.sortBy ?? 'updatedAt', // Sort by most recent conversations
    },
    populateOptions,
    dontWantToInclude
  );

    // Step 3: Remove duplicates and format data
    const uniqueUsers = {};
    
    paginatedResults.results.forEach(participant => {
    const userId = participant.userId._id.toString();
    
    if (!uniqueUsers[userId]) {
      uniqueUsers[userId] = {
        userId: {
          _userId: participant.userId._id,
          name: participant.userId.name,
          profileImage: participant.userId.profileImage,
          role: participant.userId.role
        },
        conversations: [],
        // isOnline: global.socketUtils.isUserOnline(userId), // 😄😄😄😄😄😄😄
      };
    }
    
    // Add conversation if not already added
    const conversationExists = uniqueUsers[userId].conversations.some(
      conv => conv._conversationId.toString() === participant.conversationId._id.toString()
    );
    
    if (!conversationExists) {
      uniqueUsers[userId].conversations.push({
        _conversationId: participant.conversationId._id,
        lastMessage: participant.conversationId.lastMessage,
        updatedAt: participant.conversationId.updatedAt
      });
    }
  });


    // return Object.values(uniqueUsers);
    // Return paginated response with processed data
  return {
    results: Object.values(uniqueUsers),
    page: paginatedResults.page,
    limit: paginatedResults.limit,
    totalPages: paginatedResults.totalPages,
    totalResults: paginatedResults.totalResults
  };
  }


  /**********
   * 
   * Socket Helper Function
   * 
   * we need logged in users conversationsParticipents where we want to show only another person not logged in user  
   * For App ... 
   * 
   * ********** */
  async getAllConversationsOnlyPersonInformationByUserId(userId: any) {
    
    let loggedInUserId = userId;
    // Step 1: Find all conversations the logged-in user participates in
    const userConversations = await ConversationParticipents.find({
      userId: loggedInUserId,
      isDeleted: false
    }).select('conversationId');

    const conversationIds = userConversations.map(conv => conv.conversationId);

    // Step 2: Find all participants in those conversations (excluding the logged-in user)
    const relatedParticipants = await ConversationParticipents.find({
      conversationId: { $in: conversationIds },
      userId: { $ne: loggedInUserId },
      isDeleted: false
    }).select('userId')

    // .populate({
    //   path: 'userId',
    //   select: 'name profileImage role'
    // })
    // .populate({
    //   path: 'conversationId',
    //   select: 'lastMessage updatedAt'
    // })
    ;

    // Step 3: Remove duplicates and format data
    const uniqueUsers = {};
    
    relatedParticipants.forEach(participant => {
      const userId = participant.userId._id.toString();
      /**************
      if (!uniqueUsers[userId]) {
        uniqueUsers[userId] = {
          userId: participant.userId._id 
          // {
          //   _userId: participant.userId._id,
          //   // name: participant.userId.name,
          //   // profileImage: participant.userId.profileImage,
          //   // role: participant.userId.role
          // },
          // conversations: [],
          // isOnline: global.socketUtils.isUserOnline(userId),
          // participantInfo: {
          //   joinedAt: participant.joinedAt,
          //   isDeleted: participant.isDeleted,
          //   _conversationParticipentsId: participant._id
          // }
        };
      }

      ******** */

      if (!uniqueUsers[userId]) {
        uniqueUsers[userId] = 
          participant.userId._id 
      }

      /********
      
      // Add conversation if not already added
      const conversationExists = uniqueUsers[userId].conversations.some(
        conv => conv._conversationId.toString() === participant.conversationId._id.toString()
      );
      
      if (!conversationExists) {
        uniqueUsers[userId].conversations.push({
          _conversationId: participant.conversationId._id,
          lastMessage: participant.conversationId.lastMessage,
          updatedAt: participant.conversationId.updatedAt
        });
      }

      ******* */

    });

    /********** Response Structure ... 
    
    [
        {
            "userId": "685a211bcb3b476c53324c1b"
        },
    ]

    ************ */

    return Object.values(uniqueUsers);
  }


  // async getByUserId(userId: any) {
  //   const object = await this.model.find({ userId });
  //   if (!object) {
  //     // throw new ApiError(StatusCodes.BAD_REQUEST, 'No file uploaded');
  //     return null;
  //   }
  //   return object;
  // }
}
