import { Server as SocketIOServer, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { Server } from 'http';
import { RedisStateManager } from '../redis/redisStateManagerForSocket';
import { logger } from '../../shared/logger';
//@ts-ignore
import colors from 'colors';

class SocketService {
  private static instance: SocketService;
  private io: SocketIOServer | null = null;
  private redisStateManager!: RedisStateManager;
  
  private constructor() {}

  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    return SocketService.instance;
  }

  public async initialize(
    server: Server, 
    redisPubClient: any, 
    redisSubClient: any,
    redisStateClient: any // Additional Redis client for state management
  ): Promise<SocketIOServer> {
    if (this.io) {
      return this.io;
    }

    this.io = new SocketIOServer(server, {
      pingTimeout: 60000,
      cors: { origin: '*' },
    });

    // Initialize Redis state manager
    this.redisStateManager = new RedisStateManager(redisStateClient);

    // Setup Redis adapter for cross-worker communication
    this.io.adapter(createAdapter(redisPubClient, redisSubClient));

    // Start cleanup job
    this.startCleanupJob();

    await this.setupMiddleware();
    this.setupEventHandlers();
    
    logger.info(colors.green(`🔌 Socket.IO initialized with Redis state on Worker ${process.pid}`));
    return this.io;
  }

  private startCleanupJob() {
    // Clean up stale connections every 5 minutes
    setInterval(async () => {
      try {
        await this.redisStateManager.cleanupStaleConnections();
      } catch (error) {
        logger.error('Error in cleanup job:', error);
      }
    }, 5 * 60 * 1000);
  }

  private async setupMiddleware() {
    if (!this.io) return;

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token || 
                     socket.handshake.headers.token as string;

        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const user = await this.getUserDetailsFromToken(token);
        if (!user) {
          return next(new Error('Invalid authentication token'));
        }

        socket.data.user = user;
        next();
      } catch (error) {
        console.error('Socket authentication error:', error);
        next(new Error('Authentication failed'));
      }
    });
  }

  private setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', async (socket: Socket) => {
      const user = socket.data.user;
      const userId = user._id;
      const workerId = process.pid.toString();

      logger.info(colors.blue(
        `🔌🟢 User connected: ${userId} on Worker ${workerId} Socket ${socket.id}`
      ));

      try {
        // Get user profile
        const userProfile = await this.getUserProfile(userId);
        socket.data.userProfile = userProfile;

        // Handle connection in Redis
        const oldSocketId = await this.redisStateManager.handleUserReconnection(
          userId, 
          socket.id, 
          workerId, 
          { name: user.name, profileImage: userProfile?.profileImage }
        );

        // Disconnect old socket if exists
        if (oldSocketId) {
          const oldSocket = this.io!.sockets.sockets.get(oldSocketId);
          if (oldSocket) {
            oldSocket.disconnect(true);
          }
        }

        // Join user to their personal room
        socket.join(userId);

        // Notify related users about online status
        await this.notifyRelatedUsersOnlineStatus(userId, userProfile, true);

        // Setup event handlers
        this.setupUserEventHandlers(socket, userId, userProfile);

        // Handle disconnection
        socket.on('disconnect', async () => {
          await this.handleUserDisconnection(socket, userId);
        });

      } catch (error) {
        logger.error('Error in socket connection:', error);
        socket.disconnect();
      }
    });
  }

  private setupUserEventHandlers(socket: Socket, userId: string, userProfile: any) {
    // Get related online users
    socket.on('only-related-online-users', async (data: {userId: string}, callback) => {
      try {
        const relatedOnlineUsers = await this.redisStateManager.getRelatedOnlineUsers(data.userId);
        
        logger.info(`📊 Related online users for ${data.userId}: ${relatedOnlineUsers.length}`);
        callback?.({ success: true, data: relatedOnlineUsers });
      } catch (error) {
        logger.error('Error getting related online users:', error);
        callback?.({ success: false, message: 'Failed to fetch related online users' });
      }
    });

    // Join conversation
    socket.on('join', async (conversationData: {conversationId: string}, callback) => {
      if (!conversationData.conversationId) {
        return this.emitError(socket, 'conversationId is required');
      }

      const conversationId = conversationData.conversationId;
      
      // Join socket.io room
      socket.join(conversationId);
      
      // Update Redis state
      await this.redisStateManager.joinRoom(userId, conversationId);
      
      // Get room users from Redis
      const roomUsers = await this.redisStateManager.getRoomUsers(conversationId);
      
      logger.info(`👥 Room ${conversationId} has ${roomUsers.length} users: ${roomUsers.join(', ')}`);

      
      // Notify others in the chat
      socket.to(conversationId).emit('user-joined-chat', {
        userId,
        userName: userProfile?.name,
        conversationId,
        isOnline: true
      });
    });

    // Leave conversation
    socket.on('leave', async (conversationData: {conversationId: string}, callback) => {
      if (!conversationData.conversationId) {
        return callback?.({ success: false, message: 'conversationId is required' });
      }

      const conversationId = conversationData.conversationId;
      
      // Leave socket.io room
      socket.leave(conversationId);
      
      // Update Redis state
      await this.redisStateManager.leaveRoom(userId, conversationId);
      
      socket.to(conversationId).emit('user-left-conversation', {
        userId,
        userName: userProfile?.name,
        conversationId,
        message: `${userProfile?.name} left the conversation`
      });

      callback?.({ success: true, message: 'Left conversation successfully' });
    });

    // Add other event handlers here (send-new-message, get-all-conversations, etc.)
    // ... (your existing event handlers remain the same)
  }

  private async handleUserDisconnection(socket: Socket, userId: string) {
    logger.info(colors.red(`🔌🔴 User disconnected: ${userId} Socket ${socket.id}`));
    
    try {
      // Remove from Redis state
      await this.redisStateManager.removeOnlineUser(userId, socket.id);
      
      // Notify related users about offline status
      await this.notifyRelatedUsersOnlineStatus(userId, null, false);
      
    } catch (error) {
      logger.error('Error handling user disconnection:', error);
    }
  }

  private async notifyRelatedUsersOnlineStatus(userId: string, userProfile: any, isOnline: boolean) {
    try {
      const relatedUsers = await this.redisStateManager.getRelatedOnlineUsers(userId);
      
      relatedUsers.forEach((relatedUserId: string) => {
        this.io!.emit(`related-user-online-status::${relatedUserId}`, {
          userId,
          isOnline,
          userName: userProfile?.name || '',
        });
      });

    } catch (error) {
      logger.error('Error notifying related users:', error);
    }
  }

  // =============================================
  // Public API Methods
  // =============================================

  public async emitToUser(userId: string, event: string, data: any): Promise<boolean> {
    if (!this.io) return false;
    
    const isOnline = await this.redisStateManager.isUserOnline(userId);
    if (isOnline) {
      this.io.to(userId).emit(event, data);
      return true;
    }
    return false;
  }

  public async emitToConversation(conversationId: string, event: string, data: any) {
    if (!this.io) return;
    this.io.to(conversationId).emit(event, data);
  }

  public emit(event: string, data: any) {
    if (!this.io) return;
    this.io.emit(event, data);
  }

  public async getOnlineUsers(): Promise<string[]> {
    return await this.redisStateManager.getAllOnlineUsers();
  }

  public async isUserOnline(userId: string): Promise<boolean> {
    return await this.redisStateManager.isUserOnline(userId);
  }

  public async getUserConnectionInfo(userId: string) {
    return await this.redisStateManager.getUserConnectionInfo(userId);
  }

  public async getSystemStats() {
    return await this.redisStateManager.getSystemStats();
  }

  // Helper methods (same as before)
  private async getUserDetailsFromToken(token: string) {
    const getUserDetailsFromToken = (await import('../getUesrDetailsFromToken')).default;
    return await getUserDetailsFromToken(token);
  }

  private async getUserProfile(userId: string) {
    const User = (await import('../../modules/user.module/user/user.model'))//.default;
    return await User.findById(userId, 'id name profileImage');
  }

  private emitError(socket: Socket, message: string, disconnect = false) {
    socket.emit('error', { message });
    if (disconnect) socket.disconnect();
  }

  public close() {
    if (this.io) {
      this.io.close();
      this.io = null;
    }
  }
}

export const socketService = SocketService.getInstance();