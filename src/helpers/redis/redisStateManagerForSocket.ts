import Redis from 'ioredis';
import colors from 'colors';
import { logger } from '../../shared/logger';

interface UserConnectionInfo {
  socketId: string;
  workerId: string;
  connectedAt: number;
  userInfo?: any;
}

export class RedisStateManager {
  private redis: Redis;
  private readonly KEYS = {
    ONLINE_USERS: 'chat:online_users',              // Set of online userIds
    USER_SOCKET_MAP: 'chat:user_socket_map:',       // Hash: userId -> {socketId, workerId, timestamp}
    SOCKET_USER_MAP: 'chat:socket_user_map:',       // Hash: socketId -> userId
    USER_ROOMS: 'chat:user_rooms:',                 // Set: userId's joined rooms
    ROOM_USERS: 'chat:room_users:',                 // Set: room's connected users
    USER_STATUS: 'chat:user_status:',               // Hash: userId -> {isOnline, lastSeen, etc}
  };

  constructor(redisClient: Redis) {
    this.redis = redisClient;
  }

  // =============================================
  // Online Users Management
  // =============================================

  async addOnlineUser(userId: string, socketId: string, workerId: string, userInfo?: any): Promise<void> {
    const pipeline = this.redis.pipeline();
    
    // Add to online users set
    pipeline.sadd(this.KEYS.ONLINE_USERS, userId);
    
    // Store user-socket mapping
    const connectionInfo: UserConnectionInfo = {
      socketId,
      workerId,
      connectedAt: Date.now(),
      userInfo
    };
    
    pipeline.hset(
      `${this.KEYS.USER_SOCKET_MAP}${userId}`, 
      'socketId', socketId,
      'workerId', workerId,
      'connectedAt', Date.now().toString(),
      'userInfo', JSON.stringify(userInfo || {})
    );
    
    // Store socket-user mapping
    pipeline.hset(`${this.KEYS.SOCKET_USER_MAP}${socketId}`, 'userId', userId);
    
    // Set user status
    pipeline.hset(
      `${this.KEYS.USER_STATUS}${userId}`,
      'isOnline', 'true',
      'lastSeen', Date.now().toString(),
      'workerId', workerId
    );
    
    await pipeline.exec();
    
    logger.info(colors.green(`✅ User ${userId} added to Redis state (Worker: ${workerId})`));
  }

  async removeOnlineUser(userId: string, socketId: string): Promise<void> {
    const pipeline = this.redis.pipeline();
    
    // Remove from online users set
    pipeline.srem(this.KEYS.ONLINE_USERS, userId);
    
    // Remove user-socket mapping
    pipeline.del(`${this.KEYS.USER_SOCKET_MAP}${userId}`);
    
    // Remove socket-user mapping
    pipeline.del(`${this.KEYS.SOCKET_USER_MAP}${socketId}`);
    
    // Update user status to offline
    pipeline.hset(
      `${this.KEYS.USER_STATUS}${userId}`,
      'isOnline', 'false',
      'lastSeen', Date.now().toString()
    );
    
    // Remove user from all rooms
    await this.removeUserFromAllRooms(userId);
    
    await pipeline.exec();
    
    logger.info(colors.red(`❌ User ${userId} removed from Redis state`));
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const isOnline = await this.redis.sismember(this.KEYS.ONLINE_USERS, userId);
    return !!isOnline;
  }

  async getAllOnlineUsers(): Promise<string[]> {
    return await this.redis.smembers(this.KEYS.ONLINE_USERS);
  }

  async getOnlineUsersCount(): Promise<number> {
    return await this.redis.scard(this.KEYS.ONLINE_USERS);
  }

  async getUserConnectionInfo(userId: string): Promise<UserConnectionInfo | null> {
    const info = await this.redis.hgetall(`${this.KEYS.USER_SOCKET_MAP}${userId}`);
    
    if (!info.socketId) return null;
    
    return {
      socketId: info.socketId,
      workerId: info.workerId,
      connectedAt: parseInt(info.connectedAt),
      userInfo: info.userInfo ? JSON.parse(info.userInfo) : undefined
    };
  }

  async getUserBySocketId(socketId: string): Promise<string | null> {
    const result = await this.redis.hget(`${this.KEYS.SOCKET_USER_MAP}${socketId}`, 'userId');
    return result;
  }

  // Handle multiple connections from same user
  async handleUserReconnection(userId: string, newSocketId: string, workerId: string, userInfo?: any): Promise<string | null> {
    const existingInfo = await this.getUserConnectionInfo(userId);
    
    if (existingInfo && existingInfo.socketId !== newSocketId) {
      logger.info(colors.yellow(`🔄 User ${userId} reconnecting. Old socket: ${existingInfo.socketId}, New socket: ${newSocketId}`));
      
      // Clean up old socket mapping
      await this.redis.del(`${this.KEYS.SOCKET_USER_MAP}${existingInfo.socketId}`);
      
      // Return old socket ID so we can disconnect it
      return existingInfo.socketId;
    }
    
    // Add new connection
    await this.addOnlineUser(userId, newSocketId, workerId, userInfo);
    return null;
  }

  // =============================================
  // Room Management
  // =============================================

  async joinRoom(userId: string, roomId: string): Promise<void> {
    const pipeline = this.redis.pipeline();
    
    // Add room to user's rooms
    pipeline.sadd(`${this.KEYS.USER_ROOMS}${userId}`, roomId);
    
    // Add user to room's users
    pipeline.sadd(`${this.KEYS.ROOM_USERS}${roomId}`, userId);
    
    await pipeline.exec();
    
    logger.info(`👥 User ${userId} joined room ${roomId}`);
  }

  async leaveRoom(userId: string, roomId: string): Promise<void> {
    const pipeline = this.redis.pipeline();
    
    // Remove room from user's rooms
    pipeline.srem(`${this.KEYS.USER_ROOMS}${userId}`, roomId);
    
    // Remove user from room's users
    pipeline.srem(`${this.KEYS.ROOM_USERS}${roomId}`, userId);
    
    await pipeline.exec();
    
    logger.info(`👥 User ${userId} left room ${roomId}`);
  }

  async getRoomUsers(roomId: string): Promise<string[]> {
    return await this.redis.smembers(`${this.KEYS.ROOM_USERS}${roomId}`);
  }

  async getUserRooms(userId: string): Promise<string[]> {
    return await this.redis.smembers(`${this.KEYS.USER_ROOMS}${userId}`);
  }

  async removeUserFromAllRooms(userId: string): Promise<void> {
    const userRooms = await this.getUserRooms(userId);
    
    if (userRooms.length === 0) return;
    
    const pipeline = this.redis.pipeline();
    
    // Remove user from all their rooms
    userRooms.forEach(roomId => {
      pipeline.srem(`${this.KEYS.ROOM_USERS}${roomId}`, userId);
    });
    
    // Clear user's rooms list
    pipeline.del(`${this.KEYS.USER_ROOMS}${userId}`);
    
    await pipeline.exec();
    
    logger.info(`🧹 Removed user ${userId} from ${userRooms.length} rooms`);
  }

  // =============================================
  // Related Users (for your chat system)
  // =============================================

  async getRelatedOnlineUsers(userId: string): Promise<string[]> {
    try {
      // Get all online users
      const allOnlineUsers = await this.getAllOnlineUsers();
      
      // Your existing logic to find related users
      const ConversationParticipents = (
        await import('../models/ConversationParticipents')).default;
      const ConversationParticipentsService = 
      (await import('../services/ConversationParticipentsService')).default;
      
      const usersWithConversations = await new ConversationParticipentsService()
        .getAllConversationsOnlyPersonInformationByUserId(userId);
      
      // Filter online users who have conversations with this user
      const relatedOnlineUsers = allOnlineUsers.filter(onlineUserId => 
        usersWithConversations.some((conversationUserId: any) => 
          conversationUserId.equals && conversationUserId.equals(onlineUserId)
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

  async cleanupStaleConnections(): Promise<void> {
    const onlineUsers = await this.getAllOnlineUsers();
    const staleThreshold = Date.now() - (5 * 60 * 1000); // 5 minutes
    
    for (const userId of onlineUsers) {
      const connectionInfo = await this.getUserConnectionInfo(userId);
      
      if (connectionInfo && connectionInfo.connectedAt < staleThreshold) {
        logger.warn(`🧹 Cleaning up stale connection for user ${userId}`);
        await this.removeOnlineUser(userId, connectionInfo.socketId);
      }
    }
  }

  async getSystemStats(): Promise<any> {
    const stats = {
      totalOnlineUsers: await this.getOnlineUsersCount(),
      onlineUsers: await this.getAllOnlineUsers(),
      timestamp: Date.now()
    };
    
    return stats;
  }

  // Set TTL for user data (optional cleanup)
  async setUserDataTTL(userId: string, ttlSeconds: number = 86400): Promise<void> {
    const pipeline = this.redis.pipeline();
    
    pipeline.expire(`${this.KEYS.USER_SOCKET_MAP}${userId}`, ttlSeconds);
    pipeline.expire(`${this.KEYS.USER_STATUS}${userId}`, ttlSeconds);
    pipeline.expire(`${this.KEYS.USER_ROOMS}${userId}`, ttlSeconds);
    
    await pipeline.exec();
  }
}
