// src/helpers/redis/RedisStateManager.ts
//@ts-ignore
import { RedisClientType } from 'redis';
//@ts-ignore
import colors from 'colors';
import { logger } from '../../shared/logger';
import { IUserProfile } from '../socket/socketForChatV3';
import { ConversationParticipentsService } from '../../modules/chatting.module/conversationParticipents/conversationParticipents.service';

interface UserConnectionInfo {
  socketId: string;
  workerId: string;
  connectedAt: number;
  userInfo?: IUserProfile;
}

const conversationParticipentsService = new ConversationParticipentsService();
export class RedisStateManager {
  private redis: RedisClientType;
  private readonly KEYS = {
    ONLINE_USERS: 'chat:online_users',              // Set of online userIds
    USER_SOCKET_MAP: 'chat:user_socket_map:',       // Hash: userId -> connection info
    SOCKET_USER_MAP: 'chat:socket_user_map:',       // Hash: socketId -> userId
    USER_ROOMS: 'chat:user_rooms:',                 // Set: userId's joined rooms
    ROOM_USERS: 'chat:room_users:',                 // Set: room's connected users
    USER_STATUS: 'chat:user_status:',               // Hash: userId -> status
  };

  constructor(redisClient: RedisClientType) {
    this.redis = redisClient;
  }

  // =============================================
  // Online Users Management
  // =============================================

  // 🔗➡️ socketForChatV3.ts -> setupEventHandlers
  async handleUserReconnection(
    userId: string,
    newSocketId: string,
    workerId: string,
    userInfo?: IUserProfile
  ): Promise<string | null> {
    const existingInfo = await this.getUserConnectionInfo(userId);

    if (existingInfo && existingInfo.socketId !== newSocketId) {
      logger.info(
        colors.yellow(
          `🔄 User ${userId} reconnecting. Old socket: ${existingInfo.socketId}, New socket: ${newSocketId}`
        )
      );

      // Clean up old socket mapping
      await this.redis.del(`${this.KEYS.SOCKET_USER_MAP}${existingInfo.socketId}`);

      // Return old socket ID so caller can disconnect it
      return existingInfo.socketId;
    }

    // Add new connection
    await this.addOnlineUser(userId, newSocketId, workerId, userInfo);
    return null;
  }

  // 🔗➡️ handleUserReconnection
  async addOnlineUser(userId: string, socketId: string, workerId: string, userInfo?: IUserProfile): Promise<void> {
    // Validate types
    if (typeof userId !== 'string') {
      logger.error('❌ userId is not a string:', { type: typeof userId, value: userId });
      throw new Error('userId must be a string');
    }
    if (typeof socketId !== 'string') {
      logger.error('❌ socketId is not a string:', { type: typeof socketId, value: socketId });
      throw new Error('socketId must be a string');
    }

    const pipeline = this.redis.multi(); // Use .multi() for transactions in redis v4+

    // Adds the user to the online users set.
    pipeline.sAdd(this.KEYS.ONLINE_USERS, userId);

    // Store user-socket mapping
    pipeline.hSet(
      `${this.KEYS.USER_SOCKET_MAP}${userId}`,
      {
        socketId,
        workerId,
        connectedAt: Date.now().toString(),
        userInfo: JSON.stringify(userInfo || {}),
      }
    );

    // Store socket-user mapping
    pipeline.hSet(`${this.KEYS.SOCKET_USER_MAP}${socketId}`, { userId });

    // Set user status
    pipeline.hSet(
      `${this.KEYS.USER_STATUS}${userId}`,
      {
        isOnline: 'true',
        lastSeen: Date.now().toString(),
        workerId,
      }
    );

    await pipeline.exec();

    logger.info(colors.green(`✅ User ${userId} added to Redis state (Worker: ${workerId})`));
  }

  // 🔗➡️ cleanupStaleConnections
  async removeOnlineUser(userId: string, socketId: string): Promise<void> {
    const pipeline = this.redis.multi();

    // Remove from online users set
    pipeline.sRem(this.KEYS.ONLINE_USERS, userId);

    // Remove user-socket mapping
    pipeline.del(`${this.KEYS.USER_SOCKET_MAP}${userId}`);

    // Remove socket-user mapping
    pipeline.del(`${this.KEYS.SOCKET_USER_MAP}${socketId}`);

    // Update user status to offline
    pipeline.hSet(
      `${this.KEYS.USER_STATUS}${userId}`,
      {
        isOnline: 'false',
        lastSeen: Date.now().toString(),
      }
    );

    // Remove user from all rooms
    await this.removeUserFromAllRooms(userId);

    await pipeline.exec();

    logger.info(colors.red(`❌ User ${userId} removed from Redis state`));
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const isMember = await this.redis.sIsMember(this.KEYS.ONLINE_USERS, userId);
    return isMember;
  }

  async getAllOnlineUsers(): Promise<string[]> {
    return await this.redis.sMembers(this.KEYS.ONLINE_USERS);
  }

  // 🔗➡️ getSystemStats
  async getOnlineUsersCount(): Promise<number> {
    return await this.redis.sCard(this.KEYS.ONLINE_USERS);
  }

  // 🔗➡️ cleanupStaleConnections || handleUserReconnection
  async getUserConnectionInfo(userId: string): Promise<UserConnectionInfo | null> {
    const info = await this.redis.hGetAll(`${this.KEYS.USER_SOCKET_MAP}${userId}`);

    // hGetAll returns {} if key doesn't exist
    if (!info || Object.keys(info).length === 0) return null;

    return {
      socketId: info.socketId,
      workerId: info.workerId,
      connectedAt: parseInt(info.connectedAt, 10),
      userInfo: info.userInfo ? JSON.parse(info.userInfo) : undefined,
    };
  }

  async getUserBySocketId(socketId: string): Promise<string | null> {
    const userId = await this.redis.hGet(`${this.KEYS.SOCKET_USER_MAP}${socketId}`, 'userId');
    return userId; // string or null
  }

  // =============================================
  // Room Management
  // =============================================

  async joinRoom(userId: string, roomId: string): Promise<void> {
    const pipeline = this.redis.multi();

    // Add room to user's rooms
    pipeline.sAdd(`${this.KEYS.USER_ROOMS}${userId}`, roomId);

    // Add user to room's users
    pipeline.sAdd(`${this.KEYS.ROOM_USERS}${roomId}`, userId);

    await pipeline.exec();

    logger.info(`👥 User ${userId} joined room ${roomId}`);
  }

  async leaveRoom(userId: string, roomId: string): Promise<void> {
    const pipeline = this.redis.multi();

    // Remove room from user's rooms
    pipeline.sRem(`${this.KEYS.USER_ROOMS}${userId}`, roomId);

    // Remove user from room's users
    pipeline.sRem(`${this.KEYS.ROOM_USERS}${roomId}`, userId);

    await pipeline.exec();

    logger.info(`👥 User ${userId} left room ${roomId}`);
  }

  async getRoomUsers(roomId: string): Promise<string[]> {
    return await this.redis.sMembers(`${this.KEYS.ROOM_USERS}${roomId}`);
  }

  // this method add for handle push notification
  // here roomId means conversationId
  async isUserInRoom(userId: string, roomId: string): Promise<boolean> {
    return await this.redis.sIsMember(`${this.KEYS.ROOM_USERS}${roomId}`, userId);
  }


  async getUserRooms(userId: string): Promise<string[]> {
    return await this.redis.sMembers(`${this.KEYS.USER_ROOMS}${userId}`);
  }

  async removeUserFromAllRooms(userId: string): Promise<void> {
    const userRooms = await this.getUserRooms(userId);

    if (userRooms.length === 0) return;

    const pipeline = this.redis.multi();

    // Remove user from all their rooms
    for (const roomId of userRooms) {
      pipeline.sRem(`${this.KEYS.ROOM_USERS}${roomId}`, userId);
    }

    // Clear user's rooms list
    pipeline.del(`${this.KEYS.USER_ROOMS}${userId}`);

    await pipeline.exec();

    logger.info(`🧹 Removed user ${userId} from ${userRooms.length} rooms`);
  }

  // =============================================
  // Related Users
  // =============================================

  //🔗➡️ socketForChatV3.ts -> notifyRelatedUsersOnlineStatus
  // 🔗➡️ socketForChatV3.ts ->  setupUserEventHandlers -> socket.on('only-related-online-users'
  async getRelatedOnlineUsers(userId: string): Promise<string[]> {
    try {
      const allOnlineUsers = await this.getAllOnlineUsers();

    //🔎 need to check these codes 
      const usersWithConversations = await conversationParticipentsService
        .getAllConversationsOnlyPersonInformationByUserId(userId);

      const relatedOnlineUsers = allOnlineUsers.filter((onlineUserId) =>
        usersWithConversations.some(
          (conversationUser: any) =>
            conversationUser?._id?.toString() === onlineUserId ||
            conversationUser?.toString() === onlineUserId
        )
      );

      return relatedOnlineUsers;
    } catch (error) {
      logger.error('Error getting related online users:', error);
      return [];
    }
  }

  // =============================================
  // Cleanup & Maintenance
  // =============================================

  // 🔗➡️ socketForChatV3.ts -> startCleanupJob
  async cleanupStaleConnections(): Promise<void> {
    const onlineUsers = await this.getAllOnlineUsers();
    const staleThreshold = Date.now() - 5 * 60 * 1000; // 5 minutes

    for (const userId of onlineUsers) {
      const connectionInfo = await this.getUserConnectionInfo(userId);

      if (connectionInfo && connectionInfo.connectedAt < staleThreshold) {
        logger.warn(`🧹 Cleaning up stale connection for user ${userId}`);
        await this.removeOnlineUser(userId, connectionInfo.socketId);
      }
    }
  }

  // 🔗➡️ socketForChatV3.ts -> getSystemStats
  async getSystemStats(): Promise<any> {
    return {
      totalOnlineUsers: await this.getOnlineUsersCount(),
      onlineUsers: await this.getAllOnlineUsers(),
      timestamp: Date.now(),
    };
  }

  async setUserDataTTL(userId: string, ttlSeconds: number = 86400): Promise<void> {
    const pipeline = this.redis.multi();

    pipeline.expire(`${this.KEYS.USER_SOCKET_MAP}${userId}`, ttlSeconds);
    pipeline.expire(`${this.KEYS.USER_STATUS}${userId}`, ttlSeconds);
    pipeline.expire(`${this.KEYS.USER_ROOMS}${userId}`, ttlSeconds);

    await pipeline.exec();
  }
}