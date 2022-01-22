import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Car, CarDocument } from './schemas/car.schema';

@Injectable()
export class CarsService {
  constructor(@InjectModel(Car.name) private carModel: Model<CarDocument>) {}

  async create(createCarDto: CreateCarDto): Promise<Car> {
    const createdCar = new this.carModel({ ...createCarDto });
    return await createdCar.save();
  }
  
  async findAll(): Promise<Car[]> {
    return this.carModel.find().exec();
  }

  async findOne(id: String): Promise<Car> {
    return this.carModel.findById(id);
  }

  async update(id: string, updateCarDto: UpdateCarDto) {
    return await this.carModel.findByIdAndUpdate(id, { ...updateCarDto }, { new: true });
  }

  async remove(id: String) {
    await this.carModel.findByIdAndDelete(id);
    return;
  }
}
