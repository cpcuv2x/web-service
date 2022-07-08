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
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not specified");
    }
    if (!process.env.INFLUX_TOKEN) {
      throw new Error("INFLUX_TOKEN is not specified");
    }
  }

  getConfig() {
    return {
      app: {
        port: process.env.APP_PORT ?? 5000,
      },
      jwt: {
        secret: process.env.JWT_SECRET!,
        expiresIn: process.env.JWT_EXPIRATION_TIME ?? "12h",
      },
      kafka: {
        enabled: (process.env.KAFKA_ENABLED ?? "true") === "true",
        host: process.env.KAFKA_HOST ?? "localhost:9092",
        topic: process.env.KAFKA_TOPIC ?? "cpcuv2x-events-web-service",
      },
      influx: {
        host: process.env.INFLUX_HOST ?? "http://localhost:8086",
        token: process.env.INFLUX_TOKEN!,
        bucket: process.env.INFLUX_BUCKET ?? "cpcuv2x",
        org: process.env.INFLUX_ORG ?? "cpcuv2x",
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
            description: "",
          },
          {
            url: "/api",
            description: "Gateway",
          },
        ],
        apis: [
          "src/**/*Router.ts",
          "src/**/swagger.yaml",
          "dist/**/*Router.js",
          "dist/**/swagger.yaml",
        ],
      },
      redis: {
        url: "redis://:" + process.env.REDIS_PASSWORD + "@" + process.env.REDIS_HOST + ":" + process.env.REDIS_PORT ??
          "redis://:yourpassword@redis:6379"
      }
    };
  }
}
