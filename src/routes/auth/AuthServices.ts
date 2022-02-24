import { PrismaClient, User } from "@prisma/client";
import * as bcrypt from "bcrypt";
import createHttpError from "http-errors";
import jwt from "jsonwebtoken";
import { Configurations } from "../../commons/Configurations";
import { LoginDto, RegisterDto } from "./interface";

interface AuthServicesDependencies {
  configurations: Configurations;
  prismaClient: PrismaClient;
}

export class AuthServices {
  private dependencies: AuthServicesDependencies;

  constructor(dependencies: AuthServicesDependencies) {
    this.dependencies = dependencies;
  }

  public async login(payload: LoginDto): Promise<Omit<User, "password">> {
    const { prismaClient } = this.dependencies;

    const { username, password, role } = payload;
    const user = await prismaClient.user.findFirst({
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

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  public async register(payload: RegisterDto): Promise<Omit<User, "password">> {
    const { prismaClient } = this.dependencies;

    const { username, password, role } = payload;
    const existingUser = await prismaClient.user.findUnique({
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

    const user = await prismaClient.user.create({
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
    const { configurations } = this.dependencies;

    const { secret, expiresIn } = configurations.getConfig().jwt;

    return jwt.sign(userWithoutPassword, secret!, {
      expiresIn: expiresIn,
    });
  }
}
