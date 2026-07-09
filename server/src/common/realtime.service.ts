import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class RealtimeService {
  private server: Server | null = null;

  setServer(server: Server) {
    this.server = server;
  }

  emitToUser(userId: string, event: string, data: any) {
    if (!this.server) return;
    for (const [, socket] of this.server.sockets.sockets) {
      if (socket.data.userId === userId) {
        socket.emit(event, data);
      }
    }
  }

  emitToRole(role: string, event: string, data: any) {
    if (!this.server) return;
    for (const [, socket] of this.server.sockets.sockets) {
      if (socket.data.role === role) {
        socket.emit(event, data);
      }
    }
  }

  broadcast(event: string, data: any) {
    if (!this.server) return;
    this.server.emit(event, data);
  }
}
