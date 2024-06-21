import { Injectable } from '@nestjs/common';
import { Server } from 'socket.io';

@Injectable()
export class SocketService {
  private server: Server;

  public initServer(server: Server) {
    this.server = server;
  }

  public emit(identityHash: string, payload: any) {
    this.server.to(identityHash).emit(payload);
  }
}
