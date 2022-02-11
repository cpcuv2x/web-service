import swaggerJSDoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CPCU-V2X Web Service Express API",
      version: "0.0.0",
      description:
        "This is a web service for V2X application made with Express and documented with Swagger.",
    },
  },
  basePath: "/api/v1",
  apis: ["src/**/controllers.ts", "src/**/swagger.yaml"],
};

export const swaggerSpecs = swaggerJSDoc(options);
