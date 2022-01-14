import { Injectable } from '@nestjs/common';
import { CreateCarDto } from './dto/create-car.dto';
import { UpdateCarDto } from './dto/update-car.dto';
import { Car } from './entities/car.entity';

@Injectable()
export class CarsService {
  private cars: Car[] = [];
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
    let index = this.cars.findIndex(c => c.id === id.toString());
    //console.log(id.toString());
    //console.log(index);
    this.cars[index] = { ...this.cars[index], ...updateCarDto };
    return this.cars[index];
  }

  remove(id: number) {
    let index = this.cars.findIndex(c => c.id === id.toString());
    //console.log(index);
    this.cars.splice(index, 1);
    return;
  }
}
