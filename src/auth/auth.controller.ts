import { Response } from 'express';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { COOKIE_JWT_KEY } from '../constants';
import { Serialize } from '../interceptors/serialize.interceptor';
import { UserDto } from '../user/dtos/user.dto';
import { LoginDto } from '../user/dtos/login.dto';
import { RegisterDto } from '../user/dtos/register.dto';
import { UserDocument } from '../user/schema/user.schema';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

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

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.login(body);
    const token = this.authService.getToken(user as UserDocument);
    res.cookie(COOKIE_JWT_KEY, token);
    return user;
  }

  @Post('/logout')
  @HttpCode(HttpStatus.OK)
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie(COOKIE_JWT_KEY);
    return {};
  }

  @Get('/currentuser')
  @UseGuards(JwtAuthGuard)
  currentUser(@Req() req: Request & { user: any }) {
    return req.user;
  }
}
