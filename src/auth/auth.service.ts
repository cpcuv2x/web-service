import * as bcrypt from 'bcrypt';
import { BadRequestException, Injectable } from '@nestjs/common';
import { RegisterDto } from '../user/dtos/register.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(private userService: UserService) {}

  async register(registerDto: RegisterDto) {
    const { email, password, role } = registerDto;
    const [existingUser] = await this.userService.find({ email });
    if (existingUser) {
      throw new BadRequestException('email has already been used');
    }
    // Generate hashed and salted password
    const saltRounds = 10;
    const hash = await bcrypt.hash(password, saltRounds);

    return this.userService.create({ email, password: hash, role });
  }
}
