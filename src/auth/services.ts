import { PrismaClient, User } from "@prisma/client";
import * as bcrypt from "bcrypt";
import createHttpError from "http-errors";
import jwt from "jsonwebtoken";
import { getConfig } from "../commons/config";
import { LoginDto, RegisterDto } from "./interface";

const prisma = new PrismaClient();

export const login = (payload: LoginDto) => {};

export const register = async (
  payload: RegisterDto
): Promise<Omit<User, "password">> => {
  const { username, password, role } = payload;
  const existingUser = await prisma.user.findUnique({
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

  const user = await prisma.user.create({
    data: {
      username,
      password: hash,
      role,
    },
  });

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const getJWT = (userWithoutPassword: Omit<User, "password">) => {
  return jwt.sign(userWithoutPassword, getConfig().jwt.secret!, {
    expiresIn: getConfig().jwt.expiresIn,
  });
};
