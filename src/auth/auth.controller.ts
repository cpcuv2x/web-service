import { Body, Controller, Post } from '@nestjs/common';
import { RegisterDto } from '../user/dtos/register.dto';
import { AuthService } from './auth.service';

@Controller()
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/register')
  async register(@Body() body: RegisterDto) {
    const user = await this.authService.register(body);
    return user;
  }
}
