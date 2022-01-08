import { IsEmail, IsEnum, IsString } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsEnum(UserRole)
  role: UserRole;
}
