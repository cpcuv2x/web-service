import { PrismaClient } from "@prisma/client";
import { SocketIO } from "./SocketIO";

interface DBPollingDependencies {
  prismaClient: PrismaClient;
  socketIO: SocketIO;
}

export class DBPolling {
  private dependencies: DBPollingDependencies;

  constructor(dependencies: DBPollingDependencies) {
    this.dependencies = dependencies;
  }

  //TODO: Implement this part
}
