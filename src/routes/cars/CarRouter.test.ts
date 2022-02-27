import chai, { expect } from "chai";
import cookieParser from "cookie-parser";
import express, { NextFunction, Response } from "express";
import createHttpError from "http-errors";
import { StatusCodes } from "http-status-codes";
import Sinon from "sinon";
import sinonChai from "sinon-chai";
import supertest from "supertest";
import { Request } from "../../commons/interfaces";
import { RouteUtilities } from "../../commons/RouteUtilities";
import { CarRouter } from "./CarRouter";
import { CarServices } from "./CarServices";
import { CarStatus } from "./enums";
import { SearchCarsCriteria } from "./interfaces";

chai.use(sinonChai);

describe("CarRouter", function () {
  const sandbox = Sinon.createSandbox();

  const carServices = sandbox.createStubInstance(CarServices);

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

  const carRouter = new CarRouter({ routeUtilities, carServices });

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
        it("should call carServices.getCars with licensePlate = undefined", async function () {
          await request.get("/cars");
          expect(carServices.getCars.getCalls()[0].args[0].licensePlate).to.be
            .undefined;
        });
      });
      describe("is an empty string", function () {
        it("should call carServices.getCars with licensePlate = undefined", async function () {
          await request.get("/cars?licensePlate=");
          expect(carServices.getCars.getCalls()[0].args[0].licensePlate).to.be
            .undefined;
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
        it("should call carServices.getCars with model = undefined", async function () {
          await request.get("/cars");
          expect(carServices.getCars.getCalls()[0].args[0].model).to.be
            .undefined;
        });
      });
      describe("is an empty string", function () {
        it("should call carServices.getCars with model = undefined", async function () {
          await request.get("/cars?model=");
          expect(carServices.getCars.getCalls()[0].args[0].model).to.be
            .undefined;
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
        it("should call carServices.getCars with imageFilename = undefined", async function () {
          await request.get("/cars");
          expect(carServices.getCars.getCalls()[0].args[0].imageFilename).to.be
            .undefined;
        });
      });
      describe("is an empty string", function () {
        it("should call carServices.getCars with imageFilename = undefined", async function () {
          await request.get("/cars?imageFilename=");
          expect(carServices.getCars.getCalls()[0].args[0].imageFilename).to.be
            .undefined;
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
        it("should call carServices.getCars with status = undefined", async function () {
          await request.get("/cars");
          expect(carServices.getCars.getCalls()[0].args[0].status).to.be
            .undefined;
        });
      });
      describe("is an empty string", function () {
        it("should call carServices.getCars with status = undefined", async function () {
          await request.get("/cars?status=");
          expect(carServices.getCars.getCalls()[0].args[0].status).to.be
            .undefined;
        });
      });
      describe("is a non-empty string that is not 'INACTIVE'", function () {
        it("should call carServices.getCars with status = CarStatus.Active", async function () {
          await request.get("/cars?status=pending");
          expect(carServices.getCars.getCalls()[0].args[0].status).to.be.equal(
            CarStatus.Active
          );
        });
      });
      describe("is 'INACTIVE'", function () {
        it("should call carServices.getCars with status = CarStatus.Inactive", async function () {
          await request.get("/cars?status=INACTIVE");
          expect(carServices.getCars.getCalls()[0].args[0].status).to.be.equal(
            CarStatus.Inactive
          );
        });
      });
    });

    describe("minPassengers", function () {
      describe("is not provided", function () {
        it("should call carServices.getCars with minPassengers = undefined", async function () {
          await request.get("/cars");
          expect(carServices.getCars.getCalls()[0].args[0].minPassengers).to.be
            .undefined;
        });
      });
      describe("is an empty string", function () {
        it("should call carServices.getCars with minPassengers = undefined", async function () {
          await request.get("/cars?minPassengers=");
          expect(carServices.getCars.getCalls()[0].args[0].minPassengers).to.be
            .undefined;
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
        it("should call carServices.getCars with maxPassengers = undefined", async function () {
          await request.get("/cars");
          expect(carServices.getCars.getCalls()[0].args[0].maxPassengers).to.be
            .undefined;
        });
      });
      describe("is an empty string", function () {
        it("should call carServices.getCars with maxPassengers = undefined", async function () {
          await request.get("/cars?maxPassengers=");
          expect(carServices.getCars.getCalls()[0].args[0].maxPassengers).to.be
            .undefined;
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
        it("should call carServices.getCars with limit = 0", async function () {
          await request.get("/cars");
          expect(carServices.getCars.getCalls()[0].args[0].limit).to.be.equal(
            0
          );
        });
      });
      describe("is an empty string", function () {
        it("should call carServices.getCars with limit = 0", async function () {
          await request.get("/cars?limit=");
          expect(carServices.getCars.getCalls()[0].args[0].limit).to.be.equal(
            0
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
        it("should call carServices.getCars with offset = 0", async function () {
          await request.get("/cars");
          expect(carServices.getCars.getCalls()[0].args[0].offset).to.be.equal(
            0
          );
        });
      });
      describe("is an empty string", function () {
        it("should call carServices.getCars with offset = 0", async function () {
          await request.get("/cars?offset=");
          expect(carServices.getCars.getCalls()[0].args[0].offset).to.be.equal(
            0
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
        it("should call carServices.getCars with orderBy = 'id'", async function () {
          await request.get("/cars");
          expect(carServices.getCars.getCalls()[0].args[0].orderBy).to.be.equal(
            "id"
          );
        });
      });
      describe("is an empty string", function () {
        it("should call carServices.getCars with orderBy = 'id'", async function () {
          await request.get("/cars?orderBy=");
          expect(carServices.getCars.getCalls()[0].args[0].orderBy).to.be.equal(
            "id"
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
        it("should call carServices.getCars with orderDir = 'asc'", async function () {
          await request.get("/cars");
          expect(
            carServices.getCars.getCalls()[0].args[0].orderDir
          ).to.be.equal("asc");
        });
      });
      describe("is an empty string", function () {
        it("should call carServices.getCars with orderDir = 'asc'", async function () {
          await request.get("/cars?orderDir=");
          expect(
            carServices.getCars.getCalls()[0].args[0].orderDir
          ).to.be.equal("asc");
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
