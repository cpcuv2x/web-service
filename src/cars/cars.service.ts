import { Model } from 'mongoose';
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Car, CarDocument } from './schemas/car.schema';

@Injectable()
export class CarsService {
  constructor(@InjectModel(Car.name) private carModel: Model<CarDocument>) {}

  async create(createCarDto: CreateCarDto): Promise<Car> {
    try {
      const createdCar = new this.carModel(createCarDto);
      return await createdCar.save();
    }
    catch (error) {
      this.handleError(error)
    }   
  }

  // Dev only
  async findAll(): Promise<Car[]> {
    return this.carModel.find();
  }

  async findAllBrief() {
    return this.carModel.find().select('_id licensePlate model imageLink status');
  }

  // Dev only
  async findOne(id: string): Promise<Car> {
    return this.carModel.findById(id);
  }

  async findOneInformation(id: string) {
    try {
      return this.carModel.findById(id).select('_id licensePlate model imageLink status driverName passenger');
    }
    catch (error) {
      this.handleError(error);
    }
  }

  async update(id: string, updateCarDto: UpdateCarDto) {
    try {
      return await this.carModel.findByIdAndUpdate(id, updateCarDto, { new: true });
    }
    catch (error) {
      this.handleError(error);
    }
  }

  async remove(id: string) {
    try {
      return this.carModel.findByIdAndDelete(id);
    }
    catch (error) {
      this.handleError(error)
    }
  }

  // Orignal: dashboards.service.ts
  private handleError(error: any) {
    if (error.name === 'DocumentNotFoundError') {
      throw new NotFoundException(error.message);
    }
    if (error.name === 'CastError') {
      throw new BadRequestException(error.message);
    }
    throw new InternalServerErrorException(error.message);
  }
}
