import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';
import { UserRole } from '../enums/user-role.enum';

export class RegisterDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(8, {
    message: 'Password is too short. Minimal length is $constraint1.',
  })
  @MaxLength(20, {
    message: 'Password is too long. Maximal length is $constraint1.',
  })
  password: string;

  @IsEnum(UserRole)
  role: UserRole;
}
