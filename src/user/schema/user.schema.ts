import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole } from '../enums/user-role.enum';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ require: true })
  email: string;

  @Prop({ require: true })
  password: string;

  @Prop({ require: true })
  role: UserRole;
}

export const UserSchema = SchemaFactory.createForClass(User);
