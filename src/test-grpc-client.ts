import * as grpc from '@grpc/grpc-js';
import * as protoLoader from '@grpc/proto-loader';
import { join } from 'path';

const PROTO_PATH = join(__dirname, 'hello-world/hello-world.proto');

const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});

const helloWorldProto =
  grpc.loadPackageDefinition(packageDefinition).helloworld;

const client = new (helloWorldProto as any).HelloWorldService(
  'localhost:5000',
  grpc.credentials.createInsecure(),
);

client.GetHelloWorldMessage({ name: 'David' }, (err, message) => {
  console.log(message);
});
