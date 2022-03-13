import { UserRole } from "@prisma/client";

export interface LoginDto {
  username: string;
  password: string;
  role: UserRole;
}

export interface RegisterDto {
  username: string;
  password: string;
  role: UserRole;
}
