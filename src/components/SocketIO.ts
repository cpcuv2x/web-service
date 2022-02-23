import { Server } from "socket.io";
import { HttpServer } from "./HttpServer";

interface SocketIODependencies {
  httpServer: HttpServer;
}

export class SocketIO {
  private dependencies!: SocketIODependencies;

  private socketIOServer!: Server;

  constructor(dependencies: SocketIODependencies) {
    this.dependencies = dependencies;

    this.socketIOServer = new Server(
      this.dependencies.httpServer.getHttpServerInstance()
    );
  }

  public broadcast(event: string, message: any) {
    this.socketIOServer.sockets.emit(event, message);
  }
}
