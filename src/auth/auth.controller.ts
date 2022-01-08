import { Body, Controller, Post } from '@nestjs/common';
import { Serialize } from '../interceptors/serialize.interceptor';
import { UserDto } from '../user/dtos/user.dto';
import { RegisterDto } from '../user/dtos/register.dto';
import { AuthService } from './auth.service';

@Controller()
@Serialize(UserDto)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/register')
  async register(@Body() body: RegisterDto) {
    const user = await this.authService.register(body);
    return user;
  }
}
