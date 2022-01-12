import { Injectable } from '@nestjs/common';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { Car } from './entities/car.entity';

@Injectable()
export class CarsService {
  private readonly cars: Car[] = [];
  private lastId = 0;

  create(createCarDto: CreateCarDto) {
    const newCar = new Car({
      id: this.lastId++,
      licensePlate: createCarDto.licensePlate,
      model: createCarDto.model,
      imageLink: createCarDto.imageLink,
      status: createCarDto.status,
      driverName: createCarDto.driverName,
      passenger: createCarDto.passenger,
      streamLinks: createCarDto.streamLinks,
      socketConnection: createCarDto.socketConnection
    });
    this.cars.push(newCar);
    return newCar;
  }

  findAll() {
    return this.cars;
  }

  findOne(id: number) {
    return this.cars.find(c => c.id === id.toString());
  }

  update(id: number, updateCarDto: UpdateCarDto) {
    return `This action updates a #${id} car`;
  }

  remove(id: number) {
    return `This action removes a #${id} car`;
  }
}
