import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { Metadata, ServerUnaryCall } from '@grpc/grpc-js';

interface Name {
  name: string;
}

interface Greeting {
  text: string;
}

@Controller('hello-world')
export class HelloWorldController {
  @GrpcMethod('HelloWorldService', 'GetHelloWorldMessage')
  getHelloWorldMessage(
    data: Name,
    metadata: Metadata,
    call: ServerUnaryCall<Name, Greeting>,
  ): Greeting {
    console.log('data:', data);
    console.log('metadata:', metadata);
    console.log('call.request', call.request);
    return { text: 'Hello world, nice to meet you ' + data.name + '.' };
  }
}
