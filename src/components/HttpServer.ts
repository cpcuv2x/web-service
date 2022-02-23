import { createServer, Server } from "http";
import { Observable } from "rxjs";
import { Configurations } from "../commons/Configurations";
import { ExpressApp } from "./ExpressApp";

interface HttpServerDependencies {
  configurations: Configurations;
  expressApp: ExpressApp;
}

export class HttpServer {
  private dependencies: HttpServerDependencies;

  private httpServer!: Server;

  constructor(dependencies: HttpServerDependencies) {
    this.dependencies = dependencies;

    this.instanciateHttpServer();
  }

  private instanciateHttpServer() {
    const { expressApp } = this.dependencies;

    this.httpServer = createServer(expressApp.getExpressAppInstance());
  }

  public listen$(): Observable<string> {
    const { configurations } = this.dependencies;

    return new Observable<string>((observer) => {
      const port = configurations.getConfig().app.port;
      this.httpServer.listen(port, () => {
        observer.next(`Listening on port ${port}`);
      });
    });
  }

  public getHttpServerInstance(): Server {
    return this.httpServer;
  }
}
