export class Configurations {
  constructor() {
    this.configCheck();
  }

  configCheck() {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not specified");
    }
  }

  getConfig() {
    return {
      app: {
        port: process.env.APP_PORT ?? 5000,
      },
      jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRATION_TIME ?? "1h",
      },
      kafka: {
        host: process.env.KAFKA_HOST ?? "localhost:9092",
      },
      swagger: {
        openapi: "3.0.0",
        title: "CPCU-V2X Web Service Express API",
        version: "0.0.0",
        description:
          "This is a web service for V2X application made with Express and documented with Swagger.",
        apis: ["src/**/*Router.ts", "src/**/swagger.yaml"],
      },
    };
  }
}
