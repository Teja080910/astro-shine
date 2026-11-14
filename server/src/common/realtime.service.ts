import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class RealtimeService {
  private server: Server | null = null;
  private readonly manuallyOffline = new Set<string>();
  /**
   * Listeners invoked whenever a user's availability changes (manual toggle).
   * The chat gateway uses this to pause or resume billing without a circular
   * dependency on the astrologers service.
   */
  private availabilityListeners: Array<(userId: string) => void> = [];

  setServer(server: Server) {
    this.server = server;
  }

  onAvailabilityChange(listener: (userId: string) => void) {
    this.availabilityListeners.push(listener);
  }

  private notifyAvailability(userId: string) {
    for (const listener of this.availabilityListeners) {
      try {
        listener(userId);
      } catch {
        /* a listener must never break presence updates */
      }
    }
  }

  /** Astrologers can take themselves offline while still holding a socket. */
  setManualOffline(userId: string, offline: boolean) {
    if (offline) this.manuallyOffline.add(userId);
    else this.manuallyOffline.delete(userId);
    // Availability changed — billing must react immediately.
    this.notifyAvailability(userId);
  }

  isManuallyOffline(userId: string): boolean {
    return this.manuallyOffline.has(userId);
  }

  isUserConnected(userId: string): boolean {
    if (!this.server) return false;
    for (const [, socket] of this.server.sockets.sockets) {
      if (socket.data.userId === userId) return true;
    }
    return false;
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
