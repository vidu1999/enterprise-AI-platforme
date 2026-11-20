import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

/** Real-time Socket.IO channel: authenticated clients join `user:<userId>` and `company:<companyId>` rooms. */
@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class NotificationsGateway {
  @WebSocketServer() server?: Server;

  @SubscribeMessage('join')
  handleJoin(
    @MessageBody() payload: string | { userId?: string; companyId?: string },
    @ConnectedSocket() client: Socket,
  ) {
    if (typeof payload === 'string') {
      client.join(`user:${payload}`);
    } else if (payload && typeof payload === 'object') {
      if (payload.userId) client.join(`user:${payload.userId}`);
      if (payload.companyId) client.join(`company:${payload.companyId}`);
    }
    return { ok: true };
  }

  emitToUser(userId: string, payload: any) {
    this.server?.to(`user:${userId}`).emit('notification', payload);
  }

  emitToCompany(companyId: string, event: string, payload: any) {
    this.server?.to(`company:${companyId}`).emit(event, payload);
  }
}
