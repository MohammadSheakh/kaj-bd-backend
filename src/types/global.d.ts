// types/global.d.ts
import { Server } from 'socket.io';

declare global {
  var socketUtils: {
    io: Server;
    getOnlineUsers: () => string[];
    isUserOnline: (userId: string) => boolean;
    getUserSocketId: (userId: string) => string | undefined;
  } | undefined;
}

export {};