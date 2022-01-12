import { Controller, Get } from '@nestjs/common';
import { UserService } from './user.service';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  // FIXME: remove this route in production
  @Get()
  getAllUsers() {
    return this.userService.findAll();
  }
}
