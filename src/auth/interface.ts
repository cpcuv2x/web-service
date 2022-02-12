import { UserRole } from "@prisma/client";

export interface LoginDto {}

export interface RegisterDto {
  username: string;
  password: string;
  role: UserRole;
}
