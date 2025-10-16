/***********
 * 
 * This code is updated ... working perfectly
 * 
 * ********** */
import colors from 'colors';
import { Server, Socket } from 'socket.io';
import { logger } from '../../shared/logger';
import getUserDetailsFromToken from '../getUesrDetailsFromToken';
import { Message } from '../../modules/chatting.module/message/message.model';
import { Conversation } from '../../modules/chatting.module/conversation/conversation.model';
import { User } from '../../modules/user.module/user/user.model';
import { ConversationParticipents } from '../../modules/chatting.module/conversationParticipents/conversationParticipents.model';

import { ConversationParticipentsService } from '../../modules/chatting.module/conversationParticipents/conversationParticipents.service';
import { MessagerService } from '../../modules/chatting.module/message/message.service';

/////////////////////////////////////////
import { produceMessage } from '../kafka/kafka';

declare module 'socket.io' {
  interface Socket {
    userId?: string;
  }
}

/***********************
Key Changes Made:

Fixed parameter passing: Now properly passing all required parameters to handleUserDisconnection
Added multiple connection handling: Prevents same user from having multiple active connections
Fixed receiver logic: Corrected the logic for finding receiver in conversation participants
Added utility functions: Exposed helpful methods for checking online status
Better cleanup: Ensures all data structures are properly cleaned up on disconnection
Added better logging: More detailed connection/disconnection logs

Additional Benefits:

Memory leak prevention: Users are properly removed from all data structures
Duplicate connection handling: Automatically disconnects old connections when user connects from new device
Better error handling: More robust error handling throughout
Utility methods: Added helper functions to check online status and get socket IDs

The code now properly utilizes the data structures you mentioned and ensures clean connection management!

******************* */

// Types for better type safety
interface SocketUser {
  _id: string;
  name: string;
  // Add other user properties as needed
}

interface MessageData {
  conversationId: string;
  senderId: string;
  text: string;
  // Add other message properties as needed
}

/**********
interface TypingData {
  conversationId: string;
  status: boolean;
  users: Array<{ _id: string }>;
}
********** */

// Helper function to emit errors
function emitError(socket: any, message: string, disconnect: boolean = false) {
  socket.emit('io-error', {
    success: false,
    message,
    timestamp: new Date().toISOString()
  });
  if (disconnect) {
    socket.disconnect();
  }
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

// Helper function to handle user disconnection
const handleUserDisconnection = async(
  userId: string,
  socketId: string,
  onlineUsers: Set<string>,
  userSocketMap: Map<string, string>,
  socketUserMap: Map<string, string>,
  io: Server
) => {
  logger.info(colors.red(`🔌🔴 User disconnected: :userId: ${userId} :socketId: ${socketId}`));
  
  // Clean up all data structures
  onlineUsers.delete(userId);
  userSocketMap.delete(userId);
  socketUserMap.delete(socketId);

  /******************************************************* START */

  const conversations = await ConversationParticipents.find({
        userId
      }).select('conversationId');  

      const relatedUsersByConversationIds = await ConversationParticipents.find({
        conversationId: { $in: conversations.map(conversation => conversation.conversationId) }
      }).select('userId');

      const uniqueUserIds = [...new Set(relatedUsersByConversationIds.map((item)  => {
        if(item.userId.toString() !== userId.toString()) {
          
          return item.userId.toString()
        }
      }))];

      uniqueUserIds.forEach((relatedUserId: string) => {
        // console.log("relatedUserId: ", relatedUserId , "for userId", userId);
          io.emit(`related-user-online-status::${relatedUserId}`, {
            userId,
            isOnline: false,
            // profileImage: userProfile?.profileImage || null
          });
      });

  /******************************************************* END */
  
  // Emit updated online users list
  /************* we dont wanna provide all online users to everyone 🟢
   * 
  io.emit('online-users-updated', Array.from(onlineUsers));
  ************* */
};

const socketForChat_With_Kafka = (io: Server) => {
  // Better data structures for managing connections - MOVED INSIDE THE FUNCTION
  const onlineUsers = new Set<string>();
  const userSocketMap = new Map<string, string>(); // userId -> socketId
  const socketUserMap = new Map<string, string>(); // socketId -> userId

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || 
                   socket.handshake.headers.token as string;

      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const user = await getUserDetailsFromToken(token);
      // console.log("user from socketForChat_V2_Claude -> ", user);
      if (!user) {
        return next(new Error('Invalid authentication token'));
      }

      // Attach user to socket
      socket.data.user = user;
      next();
    } catch (error) {
      console.error('Socket authentication error:', error);
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async(socket: Socket) => {
    const user = socket.data.user as SocketUser;
    const userId = user._id;

    logger.info(colors.blue(`🔌🟢 User connected: :userId🔌: ${userId} :userName🔌: ${user.name} :socketId⚡💡: ${socket.id}`));


    try {
      // Get user profile once at connection
      const userProfile = await User.findById(userId, 'id name profileImage'); // TODO : profileImage userModel theke check korte hobe .. 
      socket.data.userProfile = userProfile;

      /***********
       * 
       *   Update Online Status - FIXED TO USE DATA STRUCTURES
       * 
       * ********** */

      // Handle multiple connections from same user
      const existingSocketId = userSocketMap.get(userId);
      if (existingSocketId && existingSocketId !== socket.id) {
        // Disconnect previous socket for this user
        const existingSocket = io.sockets.sockets.get(existingSocketId);
        if (existingSocket) {
          existingSocket.disconnect(true);
        }
        // Clean up old mapping
        socketUserMap.delete(existingSocketId);
      }

      // Update all data structures
      onlineUsers.add(userId);
      userSocketMap.set(userId, socket.id);
      socketUserMap.set(socket.id, userId);

      /********************************************************* START
       * 
       * we dont wanna send all related users to everyone .. we will send only those uses who have conversation with 
       * also we will send only those users who are online ..
       * 
       * ******** */

      const conversations = await ConversationParticipents.find({
        userId
      }).select('conversationId');  

      const relatedUsersByConversationIds = await ConversationParticipents.find({
        conversationId: { $in: conversations.map(conversation => conversation.conversationId) }
      }).select('userId');

      const uniqueUserIds = [...new Set(relatedUsersByConversationIds.map((item)  => {
        if(item.userId.toString() !== userId.toString()) {
          
          return item.userId.toString()
        }
      }))];

      uniqueUserIds.forEach((relatedUserId: string) => {
        // console.log("relatedUserId: ", relatedUserId , "for userId", userId);
          io.emit(`related-user-online-status::${relatedUserId}`, {
            userId,
            isOnline: true,
            userName: userProfile?.name || user.name,
            // profileImage: userProfile?.profileImage || null
          });
      });

      /********************************************************* END */

      // Emit updated online users list
      io.emit('all-online-users', Array.from(onlineUsers)); // 🟢 this will return all user of system 

      // io.emit('only-related-online-users', {userId, filteredOnlineUsers}); // 🟢 this will return only those users who have conversation with this user

      // Join user to their personal room for direct notifications
      socket.join(userId);




      /***********
       * 
       *   Handle Returning all related online users not all online users ..   🟢working perfectly
       * 
       * ********** */  

      socket.on('only-related-online-users', async( userId: {userId: string}, callback) =>{
        try{
          
          console.log("userId.userId: ", userId.userId);
          let usersWhohaveConversationWithThisUser = await new ConversationParticipentsService().getAllConversationsOnlyPersonInformationByUserId(userId.userId);

          /********** Response Structure ... 
          
          [
            "685a211bcb3b476c53324c1b"
          ]

          // now we have to loop through this array and 
          check if the userId is present in the onlineUsers set
          if present then we will keep the userId in the array
          
          ************ */


          console.log("online and offline related Users Array 🔊🔊", usersWhohaveConversationWithThisUser)

          const filteredOnlineUsers = Array.from(onlineUsers).filter(onlineUserId => 
            usersWhohaveConversationWithThisUser.some(conversationUserId => 
              conversationUserId.equals(onlineUserId)
            )
          );

          /*************
          
          const filteredOnlineUsers2 = new Set(
            Array.from(onlineUsers).filter(onlineUserId => 
              usersWhohaveConversationWithThisUser.some(conversationUserId => 
                conversationUserId.equals(onlineUserId)
              )
            )
          );

          ************ */

          console.log("system onlineUsers: ⚡", onlineUsers);
          console.log("related online users array: ⚡", filteredOnlineUsers , " ⚡logged in userId⚡ ", userId.userId);

          callback?.({ success: true, data: filteredOnlineUsers});
        } catch (error) {
          console.error('Error fetching conversations:', error);
          callback?.({ success: false, message: 'Failed to fetch conversations' });
        }
      })


      /***********
       * 
       *   Handle joining chat rooms  🟢working perfectly
       * 
       * ********** */  

      socket.on('join', async(conversationData: {conversationId: string}, callback) => {
        if (!conversationData.conversationId) {
          return emitError(socket, 'conversationId is required');
        }

        console.log('🚮🚮🚮🚮🚮🚮')

        

        console.log(`User ${user.name} joining chat ${conversationData.conversationId}`);
        
        // console.log(`Current userSocketMap: ${Array.from(userSocketMap.entries()).map(([k, v]) => `${k}:${v}`).join(', ')}`);
        // console.log(`Current socketUserMap: ${Array.from(socketUserMap.entries()).map(([k, v]) => `${k}:${v}`).join(', ')}`);
        // console.log(`------------------`);
        // console.log(roomSockets.map((s: any) => `${s.id} (${s.data.user.name})`).join(', '));

        socket.join(conversationData.conversationId);
        

        // Debug: Check room membership //------- from claude
        const roomSockets = await io.in(conversationData.conversationId).fetchSockets();
        console.log(`Room 💡 ${conversationData.conversationId} now has ${roomSockets.length} socket or user`); // 💡 how many users are joined in this conversation
        console.log(roomSockets.map((s: any) => `${s.id} (${s.data.user.name})`).join(', '));
        console.log(`--------------------- All current online users: ${Array.from(onlineUsers).join(', ')}`); // 💡 how many users are online 
        

        // Notify others in the chat
        socket.to(conversationData.conversationId).emit('user-joined-chat', {
          userId,
          userName: userProfile?.name || user.name,
          conversationId: conversationData.conversationId,
          isOnline:true
        });
      });

      /***********
       * 
       *   Handle fetching all conversations 🔴 working perfectly .. but we do not use this .. we use the same thing with pagination .. 
       * 
       * ********** */
      socket.on('get-all-conversations', async(conversationData: {conversationId: string}, callback) =>{
        try{
          const conversations = await new ConversationParticipentsService().getAllConversationByUserId(userId);
          console.log("conversations: 🟢🟢 ", conversations);
          callback?.({ success: true, data: conversations});// 🟡🟡 fix korte hobe .. onlineUsers er part ta .. 
        } catch (error) {
          console.error('Error fetching conversations:', error);
          callback?.({ success: false, message: 'Failed to fetch conversations' });
        }
      }) 
      

      /***********
       * 
       *   Handle fetching all conversations with pagination 🟢 working perfectly 
       * 
       * ********** */
      socket.on('get-all-conversations-with-pagination', async( conversationData: {page: number, limit: number}, callback) =>{
        try{
          const conversations = await new ConversationParticipentsService().getAllConversationByUserIdWithPagination(userId, conversationData);
          callback?.({ success: true, data: conversations});
        } catch (error) {
          console.error('Error fetching conversations:', error);
          callback?.({ success: false, message: 'Failed to fetch conversations' });
        }
      })


      /***********
       * 
       *   get all message by conversationId with pagination 🟢 working perfectly 
       * 
       * ********** */
      socket.on('get-all-message-by-conversationId', async(conversationData: {
        conversationId: string,
        page: number,
        limit: number
      }, callback) =>{
        
        let populateOptions = [
          {
            path: 'senderId',
            select: 'name profileImage'
          },
          {
            path: 'attachments',
            select: 'attachment profileImage'
          }
        ]

        try{
          const messages = await new MessagerService().getAllWithPagination(
            { conversationId: conversationData.conversationId, isDeleted: false }, // filters
            { page: conversationData.page, limit: conversationData.limit ||  Number.MAX_SAFE_INTEGER, sortBy: '-createdAt'  }, // options
            populateOptions, 
            '' // select
          );
          console.log("messages: 🟢🟢 ", messages);
          callback?.({ success: true, data: messages});
        } catch (error) {
          console.error('Error fetching conversations:', error);
          callback?.({ success: false, message: 'Failed to fetch conversations' });
        }
      })

      /***********
       * 
       *   Handle new messages  🟢working perfectly
       * 
       * ********** */

      socket.on('send-new-message', async (messageData: MessageData, callback) => {

        // console.log("requested user Id 🟡🟡",  userId)
        try {
          // console.log('New message received:', messageData);

          // if (!messageData.conversationId || !messageData.text?.trim()) {
          //   const error = 'Chat ID and message content are required';
          //   callback?.({ success: false, message: error });
          //   return emitError(socket, error);
          // }

          // Get chat details
          const {conversationData, conversationParticipants} = await getConversationById(messageData.conversationId);
          
          
          /*************
           * 
           * here we will check if the sender is a participant in the conversation or not
           * if not then we will send an error message
           * 
           * ********** */
          let isExist = false;
          conversationParticipants.forEach((participant: any) => {
            const participantId = participant.userId?.toString();
            
            if (participantId == userId.toString()) {
                isExist = true;
                return;
            }
          });

          console.log("isExist: 🟡", isExist);

        if(!isExist){
            emitError(socket, `You are not a participant in this conversation`);
        }


          /*** Check if user is blocked  - from previous logic ... ** */
          
        /*********************
         * 
         * Now we dont save message to mongodb .. 
         * 
         * we just produce Message in kafka .. 
         * 
         * ***************** */  

        /*******
        // Create message
        const newMessage = await Message.create({
          ...messageData,
          timestamp: new Date(),
          senderId: userId,
        });
        ****** */
       await produceMessage({
          ...messageData,
          timestamp: new Date(),
          senderId: userId,
        });
        console.log("Message produced to Kafka Broker successfully");

        /********
         * 
         *  lets also do this in kafka consumer ..
         * 👍👍👍👍👍
         * ******* */
          //const updatedConversation = await Conversation.findByIdAndUpdate(messageData.conversationId, {
          //  lastMessage: newMessage._id,
          //}); // .populate('lastMessage').exec()

          // Prepare message data for emission
          const messageToEmit = {
            ...messageData,
            //_id: newMessage._id, 👍👍👍👍👍
            senderId: userId, // senderId should be the userId
            name: userProfile?.name || user.name,
            image: userProfile?.profileImage,
            //createdAt: newMessage.createdAt || new Date()  👍👍👍👍
          };

          // Emit to chat room
          const eventName = `new-message-received::${messageData.conversationId}`; // ${messageData.conversationId}
         
          // when you send everyone exclude the sender
          socket.to(messageData.conversationId).emit(eventName, messageToEmit);
          
          // socket.emit(eventName, messageToEmit);

          //************************************************* */

          // 🟢 NEW: Notify all conversation participants about conversation list update
        
          // Notify each participant (except the sender if excludeUserId is provided)
          conversationParticipants.forEach((participant: any) => {
            const participantId = participant.userId?.toString();
            
            console.log(`1️⃣ .forEach Participant ID: ${participantId}, User ID: ${userId}`);
            
            // Skip the sender if excludeUserId is provided
            // if (userId && participantId == userId) {
            //   return;
            // }

            // onlineUsers.has(participantId)

            // Check if participant is online
            if (Array.from(onlineUsers).some(id => id.toString() === participantId)) {

              /***********👍👍👍👍👍👍
              // Emit to participant's personal room  .to(participantId)
              io.emit(`conversation-list-updated::${participantId}`, {
                creatorId : updatedConversation?.creatorId,
                type: updatedConversation?.type,
                siteId: updatedConversation?.siteId,
                canConversate: updatedConversation?.canConversate,
                lastMessage: {
                  _id: newMessage._id,
                  text: messageData.text,
                  senderId: userId,
                  conversationId: messageData.conversationId,
                },
                isDeleted: false,
                createdAt: "2025-07-19T12:06:00.287Z",
                _conversationId: updatedConversation?._id,
              });
              ********** */
            }else{
              // .... TODO: push notification .. 
            }
          });

          //************************************************* */

          /// / Emit to sender's personal room 
          callback?.({
            success: true,
            message: "Message sent successfully",
            messageDetails: { 
              // messageId : newMessage._id,👍👍👍👍👍
              conversationId: messageData.conversationId,
              senderId: userId,
              text: messageData.text,
              // timestamp: newMessage.createdAt || new Date(),👍👍👍👍👍
              name: userProfile?.name || user.name,
              image: userProfile?.profileImage || null

            },
          });
          
        } catch (error) {
          console.error('Error sending message:', error);
          const errorMessage = 'Failed to send message';
          callback?.({ success: false, message: errorMessage });
          emitError(socket, errorMessage);
        }
      });

      /***********
       * 
       *   Handle chat blocking 
       * 
       * ********** */

      socket.on("isChatBlocked", (data: { conversationId: string; userId: string }, callback) => {
        try {
          if (!data.conversationId || !data.userId) {
            return callback?.({ success: false, message: 'Invalid data provided' });
          }

          const message = {
            success: true,
            message: 'Chat is blocked',
            data: data.conversationId,
            timestamp: new Date().toISOString()
          };

          callback?.(message);

          // Emit to specific user and chat
          io.emit(`needRefresh::${data.userId}`, {
            success: true,
            message: `User ${data.userId} needs refresh`
          });
          io.emit(`isChatBlocked::${data.conversationId}`, message);

        } catch (error) {
          console.error('Error handling conversation block:', error);
          callback?.({ success: false, message: 'Failed to block conversation' });
        }
      });

      /*************
       * 
       * Handle leaving conversation 🟢working perfectly 
       * 
       * ************* */
      socket.on('leave', async(conversationData: {conversationId: string}, callback) => {
        if (!conversationData.conversationId) {
          return callback?.({ success: false, message: 'conversationId is required' });
        }

        socket.leave(conversationData.conversationId);

        // Debug: Check room membership //------- from claude
        const roomSockets = await io.in(conversationData.conversationId).fetchSockets();
        console.log(`Room 💡 ${conversationData.conversationId} now has ${roomSockets.length} sockets or user`);
        console.log(roomSockets.map((s: any) => `${s.id} (${s.data.user.name})`).join(', '));
        
        // console.log(`--------------------- All current online users: ${Array.from(onlineUsers).join(', ')}`); // 💡 how many users are online 
        

        socket.to(conversationData.conversationId).emit(`user-left-conversation`, {
          userId,
          userName: userProfile?.name || user.name,
          conversationId: conversationData.conversationId,
          message: `${userProfile?.name || user.name} left the conversation`
        });

        callback?.({ success: true, message: 'Left conversation successfully' });
      });

      /*************
       * 
       * Handle read receipts
       * 
       * ************* */

      socket.on('read-all-messages', ({ conversationId, users, readByUserId }) => {
        if (!conversationId || !Array.isArray(users) || !readByUserId) {
          return emitError(socket, 'Invalid read receipt data');
        }

        users.forEach((targetUserId: string) => {
          if (targetUserId !== userId) { // Don't emit to sender
            io.to(targetUserId).emit('user-read-all-conversation-messages', {
              conversationId,
              readByUserId,
              timestamp: new Date().toISOString()
            });
          }
        });
      });

      /*************
       * 
       * Handle typing indicators // TODO : logic e jhamela ase .. 
       * 
       * ************* */
      socket.on('typing', (data: TypingData, callback) => {
        try {
          if (!data.conversationId || !Array.isArray(data.users)) {
            return callback?.({ success: false, message: 'Invalid typing data' });
          }

          const userName = userProfile?.name || user.name;
          const message = data.status ? `${userName} is typing...` : '';

          // Emit to other users in the conversation
          data.users.forEach((chatUser: any) => {
            if (chatUser._id !== userId) {
              io.to(chatUser._id).emit(`typing::${data.conversationId}`, {
                status: data.status,
                writeId: userId,
                message,
                timestamp: new Date().toISOString()
              });
            }
          });

          callback?.({
            success: true,
            writeId: userId,
            message,
            status: data.status
          });

        } catch (error) {
          console.error('Error handling typing indicator:', error);
          callback?.({ success: false, message: 'Failed to update typing status' });
        }
      });

      
      /*************
       * 
       * Handle disconnection - FIXED TO PASS PARAMETERS
       * 
       * ************* */

      socket.on('disconnect', () => {
        console.log(`User ${user.name} disconnected`);
        handleUserDisconnection(userId, socket.id, onlineUsers, userSocketMap, socketUserMap, io);
      });

    } catch(error) {
      console.error('Socket connection setup error:', error);
      emitError(socket, 'Connection setup failed', true);
    }
  });

  // Error handling for the server
  io.on('error', (error) => {
    console.error('Socket.IO server error:', error);
  });

  // UTILITY FUNCTION TO GET ONLINE USERS (OPTIONAL)
  const getOnlineUsers = () => Array.from(onlineUsers);
  const isUserOnline = (userId: string) =>
  {
    console.log("onlineUsers: ", onlineUsers);
    // let res = onlineUsers.has(new ObjectId(userId));
    const isOnline = Array.from(onlineUsers).some(id => id.toString() === userId);
    console.log(`User ${userId} online 🟢 status: ${isOnline}`);
    // onlineUsers.has(userId)
    return isOnline;
  }
  const getUserSocketId = (userId: string) => userSocketMap.get(userId);

  return { 
    io, 
    getOnlineUsers, 
    isUserOnline, 
    getUserSocketId 
  };
};

export const socketHelperForKafka = { socketForChat_With_Kafka };
