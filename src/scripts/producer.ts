import { KafkaClient, Producer } from "kafka-node";
import { interval } from "rxjs";

const kafkaClient = new KafkaClient({ kafkaHost: "localhost:9092" });
const kafkaProducer = new Producer(kafkaClient);

let x = 0;

kafkaProducer.on("ready", () => {
  // interval(3000).subscribe(() =>
  //   kafkaProducer.send(
  //     [
  //       {
  //         topic: "cpcuv2x-json-events",
  //         messages: JSON.stringify({
  //           type: "car_passengers",
  //           carId: "car1",
  //           passengers: Math.floor(Math.random() * 20),
  //         }),
  //       },
  //     ],
  //     () => {}
  //   )
  // );
  // interval(3500).subscribe(() =>
  //   kafkaProducer.send(
  //     [
  //       {
  //         topic: "cpcuv2x-json-events",
  //         messages: JSON.stringify({
  //           type: "car_passengers",
  //           carId: "car2",
  //           passengers: Math.floor(Math.random() * 20),
  //         }),
  //       },
  //     ],
  //     () => {}
  //   )
  // );
  // interval(3500).subscribe(() =>
  //   kafkaProducer.send(
  //     [
  //       {
  //         topic: "cpcuv2x-json-events",
  //         messages: JSON.stringify({
  //           type: "car_passengers",
  //           carId: "car3",
  //           passengers: Math.floor(Math.random() * 20),
  //         }),
  //       },
  //     ],
  //     () => {}
  //   )
  // );
  interval(1000).subscribe(() => {
    kafkaProducer.send(
      [
        {
          topic: "cpcuv2x-json-events",
          messages: JSON.stringify({
            type: "car_position",
            carId: "car1",
            lat: x,
            long: x++,
          }),
        },
      ],
      () => {}
    );
  });
});
