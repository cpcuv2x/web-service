// Fix later

import { CarStatus } from "@prisma/client";
import chai, { expect } from "chai";
import cookieParser from "cookie-parser";
import express, { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import { StatusCodes } from "http-status-codes";
import { Container } from "inversify";
import "reflect-metadata";
import Sinon from "sinon";
import sinonChai from "sinon-chai";
import supertest from "supertest";
import winston from "winston";
import { Utilities } from "../../../commons/utilities/Utilities";
import { CarServices } from "../../../services/cars/CarService";
import { RouteUtilities } from "../../RouteUtilities";
import { CarRouter } from "./CarRouter";
import { SearchCarsCriteria } from "./interfaces";

chai.use(sinonChai);

describe("CarRouter", function () {
  const sandbox = Sinon.createSandbox();

  const mockContainer = new Container();

  const carServices = sandbox.createStubInstance(CarServices);

  mockContainer.bind(CarServices).toConstantValue(carServices);

  const authenticateJWTMiddleware = sandbox.fake(
    (req: Request, res: Response, next: NextFunction) => {
      next();
    }
  );
  const validateSchemaMiddleware = sandbox.fake(
    async (req: Request, res: Response, next: NextFunction) => {
      next();
    }
  );
  const errorHandlingMiddleware = sandbox.fake(
    (err: any, req: Request, res: Response, next: NextFunction) => {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).send(err.message);
    }
  );

  const routeUtilities = sandbox.createStubInstance(RouteUtilities, {
    authenticateJWT: sandbox.stub().callsFake(() => authenticateJWTMiddleware),
    validateSchema: sandbox.stub().callsFake(() => validateSchemaMiddleware),
    errorHandling: sandbox.stub().callsFake(() => errorHandlingMiddleware),
  });

  mockContainer.bind(RouteUtilities).toConstantValue(routeUtilities);

  const fakeLogger = winston.createLogger();

  sandbox.stub(fakeLogger, "info");
  sandbox.stub(fakeLogger, "warn");
  sandbox.stub(fakeLogger, "debug");
  sandbox.stub(fakeLogger, "error");
  sandbox.stub(fakeLogger, "verbose");

  const utilities = sandbox.createStubInstance(Utilities, {
    getLogger: sandbox
      .stub<[label: string, level: string | undefined]>()
      .returns(fakeLogger),
  });

  mockContainer.bind(Utilities).toConstantValue(utilities);

  mockContainer.bind(CarRouter).toSelf();

  const carRouter = mockContainer.get(CarRouter);

  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/cars", carRouter.getRouterInstance());
  app.use(routeUtilities.errorHandling());

  const request = supertest(app);

  describe("GET /cars", function () {
    beforeEach(function () {
      carServices.getCars.callsFake((payload: SearchCarsCriteria) =>
        Promise.resolve({
          cars: [],
          count: 0,
        })
      );
    });

    afterEach(function () {
      carServices.getCars.reset();
    });

    it("should call middleware authencticateJWT", async function () {
      await request.get("/cars");
      expect(authenticateJWTMiddleware).to.be.calledOnce;
    });

    it("should return 200 with result from carServices.getCars", async function () {
      const response = await request.get("/cars");
      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal({
        cars: [],
        count: 0,
      });
    });

    it("should call middleware errorHandling if there is an error", async function () {
      carServices.getCars.rejects(
        new createHttpError.InternalServerError("Some error.")
      );
      const response = await request.get("/cars");
      expect(errorHandlingMiddleware).to.be.calledOnce;
    });

    describe("licensePlate", function () {
      describe("is not provided", function () {
        it("should call carServices.getCars without licensePlate", async function () {
          await request.get("/cars");
          expect(carServices.getCars.getCalls()[0].args[0]).not.haveOwnProperty(
            "licensePlate"
          );
        });
      });
      describe("is an empty string", function () {
        it("should call carServices.getCars without licensePlate", async function () {
          await request.get("/cars?licensePlate=");
          expect(carServices.getCars.getCalls()[0].args[0]).not.haveOwnProperty(
            "licensePlate"
          );
        });
      });
      describe("is a non-empty string", function () {
        it("should call carServices.getCars with that licensePlate", async function () {
          await request.get("/cars?licensePlate=AA-0000");
          expect(
            carServices.getCars.getCalls()[0].args[0].licensePlate
          ).to.be.equal("AA-0000");
        });
      });
    });

    describe("model", function () {
      describe("is not provided", function () {
        it("should call carServices.getCars without model", async function () {
          await request.get("/cars");
          expect(carServices.getCars.getCalls()[0].args[0]).not.haveOwnProperty(
            "model"
          );
        });
      });
      describe("is an empty string", function () {
        it("should call carServices.getCars without model", async function () {
          await request.get("/cars?model=");
          expect(carServices.getCars.getCalls()[0].args[0]).not.haveOwnProperty(
            "model"
          );
        });
      });
      describe("is a non-empty string", function () {
        it("should call carServices.getCars with that model", async function () {
          await request.get("/cars?model=T1");
          expect(carServices.getCars.getCalls()[0].args[0].model).to.be.equal(
            "T1"
          );
        });
      });
    });

    describe("imageFilename", function () {
      describe("is not provided", function () {
        it("should call carServices.getCars without imageFilename", async function () {
          await request.get("/cars");
          expect(carServices.getCars.getCalls()[0].args[0]).not.haveOwnProperty(
            "imageFilename"
          );
        });
      });
      describe("is an empty string", function () {
        it("should call carServices.getCars without imageFilename", async function () {
          await request.get("/cars?imageFilename=");
          expect(carServices.getCars.getCalls()[0].args[0]).not.haveOwnProperty(
            "imageFilename"
          );
        });
      });
      describe("is a non-empty string", function () {
        it("should call carServices.getCars with that imageFilename", async function () {
          await request.get("/cars?imageFilename=T1");
          expect(
            carServices.getCars.getCalls()[0].args[0].imageFilename
          ).to.be.equal("T1");
        });
      });
    });

    describe("status", function () {
      describe("is not provided", function () {
        it("should call carServices.getCars without status", async function () {
          await request.get("/cars");
          expect(carServices.getCars.getCalls()[0].args[0]).not.haveOwnProperty(
            "status"
          );
        });
      });
      describe("is an empty string", function () {
        it("should call carServices.getCars without status", async function () {
          await request.get("/cars?status=");
          expect(carServices.getCars.getCalls()[0].args[0]).not.haveOwnProperty(
            "status"
          );
        });
      });
      describe("is a non-empty string that is not 'INACTIVE'", function () {
        it("should call carServices.getCars with status = CarStatus.Active", async function () {
          await request.get("/cars?status=pending");
          expect(carServices.getCars.getCalls()[0].args[0].status).to.be.equal(
            CarStatus.ACTIVE
          );
        });
      });
      describe("is 'INACTIVE'", function () {
        it("should call carServices.getCars with status = CarStatus.Inactive", async function () {
          await request.get("/cars?status=INACTIVE");
          expect(carServices.getCars.getCalls()[0].args[0].status).to.be.equal(
            CarStatus.INACTIVE
          );
        });
      });
    });

    describe("minPassengers", function () {
      describe("is not provided", function () {
        it("should call carServices.getCars without minPassengers", async function () {
          await request.get("/cars");
          expect(carServices.getCars.getCalls()[0].args[0]).not.haveOwnProperty(
            "minPassengers"
          );
        });
      });
      describe("is an empty string", function () {
        it("should call carServices.getCars without minPassengers", async function () {
          await request.get("/cars?minPassengers=");
          expect(carServices.getCars.getCalls()[0].args[0]).not.haveOwnProperty(
            "minPassengers"
          );
        });
      });
      describe("is a non-empty numeric string", function () {
        it("should call carServices.getCars with that integer parsed minPassengers", async function () {
          await request.get("/cars?minPassengers=5");
          expect(
            carServices.getCars.getCalls()[0].args[0].minPassengers
          ).to.be.equal(5);
        });
      });
      describe("is a non-empty non-numeric string", function () {
        it("should call carServices.getCars with minPassengers = NaN", async function () {
          await request.get("/cars?minPassengers=five");
          expect(carServices.getCars.getCalls()[0].args[0].minPassengers).to.be
            .NaN;
        });
      });
    });

    describe("maxPassengers", function () {
      describe("is not provided", function () {
        it("should call carServices.getCars without maxPassengers", async function () {
          await request.get("/cars");
          expect(carServices.getCars.getCalls()[0].args[0]).not.haveOwnProperty(
            "maxPassengers"
          );
        });
      });
      describe("is an empty string", function () {
        it("should call carServices.getCars without maxPassengers", async function () {
          await request.get("/cars?maxPassengers=");
          expect(carServices.getCars.getCalls()[0].args[0]).not.haveOwnProperty(
            "maxPassengers"
          );
        });
      });
      describe("is a non-empty numeric string", function () {
        it("should call carServices.getCars with that integer parsed maxPassengers", async function () {
          await request.get("/cars?maxPassengers=5");
          expect(
            carServices.getCars.getCalls()[0].args[0].maxPassengers
          ).to.be.equal(5);
        });
      });
      describe("is a non-empty non-numeric string", function () {
        it("should call carServices.getCars with maxPassengers = NaN", async function () {
          await request.get("/cars?maxPassengers=five");
          expect(carServices.getCars.getCalls()[0].args[0].maxPassengers).to.be
            .NaN;
        });
      });
    });

    describe("limit", function () {
      describe("is not provided", function () {
        it("should call carServices.getCars without limit", async function () {
          await request.get("/cars");
          expect(carServices.getCars.getCalls()[0].args[0]).not.haveOwnProperty(
            "limit"
          );
        });
      });
      describe("is an empty string", function () {
        it("should call carServices.getCars without limit", async function () {
          await request.get("/cars?limit=");
          expect(carServices.getCars.getCalls()[0].args[0]).not.haveOwnProperty(
            "limit"
          );
        });
      });
      describe("is a non-empty numeric string", function () {
        it("should call carServices.getCars with that integer parsed limit", async function () {
          await request.get("/cars?limit=5");
          expect(carServices.getCars.getCalls()[0].args[0].limit).to.be.equal(
            5
          );
        });
      });
      describe("is a non-empty non-numeric string", function () {
        it("should call carServices.getCars with limit = NaN", async function () {
          await request.get("/cars?limit=five");
          expect(carServices.getCars.getCalls()[0].args[0].limit).to.be.NaN;
        });
      });
    });

    describe("offset", function () {
      describe("is not provided", function () {
        it("should call carServices.getCars without offset", async function () {
          await request.get("/cars");
          expect(carServices.getCars.getCalls()[0].args[0]).not.haveOwnProperty(
            "offset"
          );
        });
      });
      describe("is an empty string", function () {
        it("should call carServices.getCars without offset", async function () {
          await request.get("/cars?offset=");
          expect(carServices.getCars.getCalls()[0].args[0]).not.haveOwnProperty(
            "offset"
          );
        });
      });
      describe("is a non-empty numeric string", function () {
        it("should call carServices.getCars with that integer parsed offset", async function () {
          await request.get("/cars?offset=5");
          expect(carServices.getCars.getCalls()[0].args[0].offset).to.be.equal(
            5
          );
        });
      });
      describe("is a non-empty non-numeric string", function () {
        it("should call carServices.getCars with offset = NaN", async function () {
          await request.get("/cars?offset=five");
          expect(carServices.getCars.getCalls()[0].args[0].offset).to.be.NaN;
        });
      });
    });

    describe("orderBy", function () {
      describe("is not provided", function () {
        it("should call carServices.getCars without orderBy", async function () {
          await request.get("/cars");
          expect(carServices.getCars.getCalls()[0].args[0]).not.haveOwnProperty(
            "orderBy"
          );
        });
      });
      describe("is an empty string", function () {
        it("should call carServices.getCars without orderBy", async function () {
          await request.get("/cars?orderBy=");
          expect(carServices.getCars.getCalls()[0].args[0]).not.haveOwnProperty(
            "orderBy"
          );
        });
      });
      describe("is a non-empty string", function () {
        it("should call carServices.getCars with that orderBy", async function () {
          await request.get("/cars?orderBy=licensePlate");
          expect(carServices.getCars.getCalls()[0].args[0].orderBy).to.be.equal(
            "licensePlate"
          );
        });
      });
    });

    describe("orderDir", function () {
      describe("is not provided", function () {
        it("should call carServices.getCars without orderDir", async function () {
          await request.get("/cars");
          expect(carServices.getCars.getCalls()[0].args[0]).not.haveOwnProperty(
            "orderDir"
          );
        });
      });
      describe("is an empty string", function () {
        it("should call carServices.getCars without orderDir", async function () {
          await request.get("/cars?orderDir=");
          expect(carServices.getCars.getCalls()[0].args[0]).not.haveOwnProperty(
            "orderDir"
          );
        });
      });
      describe("is a non-empty string other than 'desc'", function () {
        it("should call carServices.getCars with orderDir = 'asc'", async function () {
          await request.get("/cars?orderDir=zigzag");
          expect(
            carServices.getCars.getCalls()[0].args[0].orderDir
          ).to.be.equal("asc");
        });
      });
      describe("is 'desc'", function () {
        it("should call carServices.getCars with orderDir = 'desc'", async function () {
          await request.get("/cars?orderDir=desc");
          expect(
            carServices.getCars.getCalls()[0].args[0].orderDir
          ).to.be.equal("desc");
        });
      });
    });
  });
});
