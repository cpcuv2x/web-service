import { NestFactory } from '@nestjs/core';
import { GrpcOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const microserviceGrpc = app.connectMicroservice<GrpcOptions>({
    transport: Transport.GRPC,
    options: {
      url: '0.0.0.0:5000',
      package: 'helloworld',
      protoPath: join(__dirname, 'hello-world/hello-world.proto'),
    },
  });
  await app.startAllMicroservices();
  await app.listen(3000);
}
bootstrap();
