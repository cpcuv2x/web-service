import { inject, injectable } from "inversify";
import winston from "winston";
import { Utilities } from "../utilities/Utilities";

@injectable()
export class Configurations {
  private utilities: Utilities;

  private logger: winston.Logger;

  constructor(@inject(Utilities) utilities: Utilities) {
    this.utilities = utilities;
    this.logger = utilities.getLogger("configurations");

    this.configCheck();

    this.logger.info("constructed.");
  }

  configCheck() {
    if (!process.env.APP_PORT) {
      throw new Error("APP_PORT is not specified");
    }
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not specified");
    }
    if (!process.env.JWT_EXPIRATION_TIME) {
      throw new Error("JWT_EXPIRATION_TIME is not specified");
    }
    if (!process.env.KAFKA_ENABLED) {
      throw new Error("KAFKA_ENABLED is not specified");
    }
    if (!process.env.KAFKA_HOST) {
      throw new Error("KAFKA_HOST is not specified");
    }
    if (!process.env.KAFKA_JSON_EVENTS_TOPIC_NAME) {
      throw new Error("KAFKA_JSON_EVENTS_TOPIC_NAME is not specified");
    }
  }

  getConfig() {
    return {
      app: {
        port: process.env.APP_PORT!,
      },
      jwt: {
        secret: process.env.JWT_SECRET!,
        expiresIn: process.env.JWT_EXPIRATION_TIME!,
      },
      kafka: {
        enabled: process.env.KAFKA_ENABLED === "true",
        host: process.env.KAFKA_HOST!,
        jsonEventsTopicName: process.env.KAFKA_JSON_EVENTS_TOPIC_NAME!,
      },
      swagger: {
        openapi: "3.0.0",
        title: "CPCU-V2X Web Service Express API",
        version: "0.0.0",
        description:
          "This is a web service for V2X application made with Express and documented with Swagger.",
        servers: [
          {
            url: "/",
            description: "Local development",
          },
          {
            url: "/api",
            description: "Hamo server development",
          },
        ],
        apis: ["src/**/*Router.ts", "src/**/swagger.yaml"],
      },
    };
  }
}
