import { CarStatus, DriverStatus, PrismaClient, User, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";
import createHttpError from "http-errors";
import { inject, injectable } from "inversify";
import jwt from "jsonwebtoken";
import winston from "winston";
import { Configurations } from "../../commons/configurations/Configurations";
import { Utilities } from "../../commons/utilities/Utilities";
import {
  LoginDto,
  RegisterDto,
} from "../../express-app/routes/auth/interfaces";

@injectable()
export class AuthService {
  private utilities: Utilities;
  private configurations: Configurations;
  private prismaClient: PrismaClient;

  private logger: winston.Logger;

  constructor(
    @inject(Utilities) utilities: Utilities,
    @inject(Configurations) configurations: Configurations,
    @inject("prisma-client") prismaClient: PrismaClient,
  ) {
    this.utilities = utilities;
    this.configurations = configurations;
    this.prismaClient = prismaClient;

    this.logger = utilities.getLogger("auth-service");

    this.logger.info("constructed.");

  }

  public async login(payload: LoginDto): Promise<Omit<User, "password">> {
    const { username, password, role, carID } = payload;
    const user = await this.prismaClient.user.findFirst({
      where: {
        username,
        role,
      },
    });

    if (!user) {
      throw new createHttpError.BadRequest("Invalid credentials.");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new createHttpError.BadRequest("Invalid credentials.");
    }

    if (role === UserRole.DRIVER) {
      const user = await this.prismaClient.user.findUnique({
        where: {
          username
        },
        select: {
          Driver: true
        }
      })

      if (user?.Driver != null && user?.Driver?.id != null) {
        await this.prismaClient.$transaction(async (prisma) => {
          await prisma.car.updateMany({
            where: {
              driverId: user?.Driver?.id
            },
            data: {
              driverId: null
            }
          }
          )
          await prisma.car.update({
            where: {
              id: carID
            },
            data: {
              driverId: user?.Driver?.id
            }
          }
          )
        })
      }

    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  public async register(payload: RegisterDto): Promise<Omit<User, "password">> {
    const { username, password, role } = payload;
    const existingUser = await this.prismaClient.user.findUnique({
      where: {
        username,
      },
    });
    if (existingUser) {
      throw new createHttpError.BadRequest("Username has already been used.");
    }

    // generate hashed and salted password
    const saltRound = 10;
    const hash = await bcrypt.hash(password, saltRound);

    const user = await this.prismaClient.user.create({
      data: {
        username,
        password: hash,
        role,
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  public getJWT(userWithoutPassword: Omit<User, "password">) {
    const { secret, expiresIn } = this.configurations.getConfig().jwt;

    return jwt.sign(userWithoutPassword, secret!, {
      expiresIn: expiresIn,
    });
  }

}
