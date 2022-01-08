import { Expose } from 'class-transformer';
import { UserRole } from '../enums/user-role.enum';

export class UserDto {
  @Expose()
  id: number;

  @Expose()
  email: string;

  @Expose()
  role: UserRole;
}
