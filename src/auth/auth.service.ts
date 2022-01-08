import * as bcrypt from 'bcrypt';
import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RegisterDto } from '../user/dtos/register.dto';
import { UserDocument } from '../user/schema/user.schema';
import { UserService } from '../user/user.service';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  getToken(user: UserDocument) {
    const payload = { id: user._id, email: user.email, role: user.role };
    return this.jwtService.sign(payload);
  }

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
