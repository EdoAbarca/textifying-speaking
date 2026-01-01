import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/media',
})
export class MediaGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MediaGateway.name);
  private userSockets: Map<string, Set<string>> = new Map();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        this.logger.warn(`Client ${client.id} disconnected: No token provided`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token);
      const userId = payload.sub;

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

      client.data.userId = userId;
      this.logger.log(`Client ${client.id} connected for user ${userId}`);
    } catch (error) {
      this.logger.error(`Authentication failed for client ${client.id}:`, error.message);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data.userId;
    if (userId && this.userSockets.has(userId)) {
      const sockets = this.userSockets.get(userId)!;
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.logger.log(`Client ${client.id} disconnected`);
  }

  emitToUser(userId: string, event: string, data: any) {
    const socketIds = this.userSockets.get(userId);
    if (socketIds) {
      socketIds.forEach((socketId) => {
        this.server.to(socketId).emit(event, data);
      });
      this.logger.log(`Emitted ${event} to user ${userId} (${socketIds.size} connections)`);
    }
  }

  emitFileStatusUpdate(userId: string, fileData: any): void;
  emitFileStatusUpdate(userId: string, fileId: string, status: string, progress?: number, errorMessage?: string): void;
  emitFileStatusUpdate(userId: string, fileDataOrId: any, status?: string, progress?: number, errorMessage?: string) {
    let eventData: any;
    
    if (typeof fileDataOrId === 'string') {
      // Called with individual parameters
      eventData = { 
        fileId: fileDataOrId, 
        status, 
        progress: progress !== undefined ? progress : null,
        errorMessage: errorMessage || null,
      };
    } else {
      // Called with file data object
      eventData = fileDataOrId;
    }
    
    this.emitToUser(userId, 'fileStatusUpdate', eventData);
  }

  emitFileProgress(userId: string, fileId: string, progress: number) {
    this.emitToUser(userId, 'fileProgress', { fileId, progress });
  }

  emitSummaryStatusUpdate(
    userId: string,
    data: {
      fileId: string;
      summaryStatus: string;
      summaryText?: string;
      summaryErrorMessage?: string;
      originalFilename?: string;
    },
  ) {
    this.emitToUser(userId, 'summaryStatusUpdate', data);
  }
}
