import { User } from "@prisma/client";
import * as core from "express-serve-static-core";

export interface Request<
  P = core.ParamsDictionary,
  ResBody = any,
  ReqBody = any,
  ReqQuery = core.Query,
  Locals extends Record<string, any> = Record<string, any>
> extends core.Request<P, ResBody, ReqBody, ReqQuery, Locals> {
  user?: Omit<User, "password">;
}
