import { IsEnum, IsString } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsEnum(UserRole)
  role: UserRole;
}
