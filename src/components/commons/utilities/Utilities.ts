import { injectable } from "inversify";
import winston from "winston";

@injectable()
export class Utilities {
  private logger: winston.Logger;

  constructor() {
    this.logger = this.getLogger("utilities");

    this.logger.info("constructed.");
  }
  public getLogger(label: string, level = "debug") {
    return winston.createLogger({
      level,
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.timestamp({
          format: () => {
            return new Date().toLocaleString("en-US", {
              timeZone: "Asia/Bangkok",
              hourCycle: "h23",
            });
          },
        }),
        winston.format.label({ label, message: true }),
        winston.format.printf(
          (info) => `${info.timestamp} [${info.level}]: ${info.message}`
        )
      ),
      transports: [new winston.transports.Console()],
    });
  }
}
