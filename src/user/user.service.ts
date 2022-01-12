import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RegisterDto } from './dtos/register.dto';
import { User, UserDocument } from './schema/user.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async find(options?: Partial<User>) {
    return this.userModel.find(options);
  }

  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async create(createUserDto: RegisterDto): Promise<User> {
    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }
}
