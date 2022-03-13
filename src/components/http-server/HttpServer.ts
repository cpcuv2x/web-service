import { createServer, Server } from "http";
import { inject, injectable } from "inversify";
import winston from "winston";
import { Configurations } from "../commons/configurations/Configurations";
import { Utilities } from "../commons/utilities/Utilities";
import { ExpressApp } from "../express-app/ExpressApp";

@injectable()
export class HttpServer {
  private utilities: Utilities;
  private configurations: Configurations;
  private expressApp: ExpressApp;

  private logger: winston.Logger;

  private httpServer!: Server;

  constructor(
    @inject(Utilities) utilities: Utilities,
    @inject(Configurations) configurations: Configurations,
    @inject(ExpressApp) expressApp: ExpressApp
  ) {
    this.utilities = utilities;
    this.configurations = configurations;
    this.expressApp = expressApp;

    this.logger = utilities.getLogger("http-server");

    this.instantiate();
    this.start();

    this.logger.info("constructed.");
  }

  private instantiate() {
    this.httpServer = createServer(this.expressApp.getExpressAppInstance());
  }

  public start() {
    const port = this.configurations.getConfig().app.port;

    this.httpServer.listen(port, () => {
      this.logger.info(`listening on port ${port}.`);
    });
  }

  public getHttpServerInstance(): Server {
    return this.httpServer;
  }
}
