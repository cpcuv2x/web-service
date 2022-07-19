import { UserRole } from "@prisma/client";

export interface LoginDto {
  username: string;
  password: string;
  role: UserRole;
  carID: string;
}

export interface RegisterDto {
  id?: string;
  username: string;
  password: string;
  role: UserRole;
}
