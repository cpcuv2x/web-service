import { UserRole } from '../enums/user-role.enum';

export class JwtPayload {
  id: string;
  username: string;
  role: UserRole;
}
