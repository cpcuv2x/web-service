import { Expose } from 'class-transformer';
import { UserRole } from '../enums/user-role.enum';

export class UserDto {
  @Expose()
  id: number;

  @Expose()
  username: string;

  @Expose()
  role: UserRole;
}
