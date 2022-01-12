import { Response } from 'express';
import { Body, Controller, Post, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { COOKIE_JWT_KEY } from '../constants';
import { Serialize } from '../interceptors/serialize.interceptor';
import { UserDto } from '../user/dtos/user.dto';
import { RegisterDto } from '../user/dtos/register.dto';
import { UserDocument } from '../user/schema/user.schema';

@Controller()
@Serialize(UserDto)
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/register')
  async register(
    @Body() body: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.register(body);
    const token = this.authService.getToken(user as UserDocument);
    res.cookie(COOKIE_JWT_KEY, token);
    return user;
  }
}
