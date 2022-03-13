import { KafkaClient, Producer } from "kafka-node";
import { interval } from "rxjs";

const kafkaClient = new KafkaClient({ kafkaHost: process.env.KAFKA_HOST });
const kafkaProducer = new Producer(kafkaClient);

const topicName = "cpcuv2x-json-events";

const waypoints = [
  { lat: 13.739571, long: 100.530415 },
  { lat: 13.739526, long: 100.530749 },
  { lat: 13.73947, long: 100.531051 },
  { lat: 13.739409, long: 100.531357 },
  { lat: 13.739357, long: 100.531693 },
  { lat: 13.739317, long: 100.532011 },
  { lat: 13.739273, long: 100.532343 },
  { lat: 13.739225, long: 100.532715 },
  { lat: 13.739124, long: 100.53303 },
  { lat: 13.738867, long: 100.533175 },
  { lat: 13.738601, long: 100.533166 },
  { lat: 13.738296, long: 100.533129 },
  { lat: 13.738014, long: 100.533079 },
  { lat: 13.737745, long: 100.532972 },
  { lat: 13.737536, long: 100.532781 },
  { lat: 13.737459, long: 100.532471 },
  { lat: 13.737496, long: 100.532058 },
  { lat: 13.737589, long: 100.531586 },
  { lat: 13.737661, long: 100.531093 },
  { lat: 13.737735, long: 100.530674 },
  { lat: 13.737792, long: 100.530344 },
  { lat: 13.737905, long: 100.530035 },
  { lat: 13.738135, long: 100.529923 },
  { lat: 13.738462, long: 100.529931 },
  { lat: 13.738817, long: 100.529975 },
  { lat: 13.739097, long: 100.530006 },
  { lat: 13.739342, long: 100.53008 },
  { lat: 13.739494, long: 100.530273 },
];

kafkaProducer.on("ready", () => {
  let car0WaypointIdx = Math.floor(Math.random() * waypoints.length);
  interval(1000).subscribe(() => {
    kafkaProducer.send(
      [
        {
          topic: topicName,
          messages: JSON.stringify({
            type: "CAR_LOCATION",
            carId: "CAR-0",
            carLicensePlate: "AA-0000",
            lat: waypoints[car0WaypointIdx].lat,
            long: waypoints[car0WaypointIdx].long,
          }),
        },
      ],
      () => {}
    );
    car0WaypointIdx = (car0WaypointIdx + 1) % waypoints.length;
  });
  let car1WaypointIdx = Math.floor(Math.random() * waypoints.length);
  interval(1000).subscribe(() => {
    kafkaProducer.send(
      [
        {
          topic: topicName,
          messages: JSON.stringify({
            type: "CAR_LOCATION",
            carId: "CAR-1",
            carLicensePlate: "AA-0001",
            lat: waypoints[car1WaypointIdx].lat,
            long: waypoints[car1WaypointIdx].long,
          }),
        },
      ],
      () => {}
    );
    car1WaypointIdx = (car1WaypointIdx + 1) % waypoints.length;
  });
  let car2WaypointIdx = Math.floor(Math.random() * waypoints.length);
  interval(1000).subscribe(() => {
    kafkaProducer.send(
      [
        {
          topic: topicName,
          messages: JSON.stringify({
            type: "CAR_LOCATION",
            carId: "CAR-2",
            carLicensePlate: "AA-0002",
            lat: waypoints[car2WaypointIdx].lat,
            long: waypoints[car2WaypointIdx].long,
          }),
        },
      ],
      () => {}
    );
    car2WaypointIdx = (car2WaypointIdx + 1) % waypoints.length;
  });
  interval(10000).subscribe(() => {
    kafkaProducer.send(
      [
        {
          topic: topicName,
          messages: JSON.stringify({
            type: "CAR_PASSENGERS",
            carId: "CAR-0",
            carLicensePlate: "AA-0000",
            passengers: Math.floor(Math.random() * 10),
          }),
        },
      ],
      () => {}
    );
  });
  interval(10000).subscribe(() => {
    kafkaProducer.send(
      [
        {
          topic: topicName,
          messages: JSON.stringify({
            type: "CAR_PASSENGERS",
            carId: "CAR-1",
            carLicensePlate: "AA-0001",
            passengers: Math.floor(Math.random() * 10),
          }),
        },
      ],
      () => {}
    );
  });
  interval(10000).subscribe(() => {
    kafkaProducer.send(
      [
        {
          topic: topicName,
          messages: JSON.stringify({
            type: "CAR_PASSENGERS",
            carId: "CAR-2",
            carLicensePlate: "AA-0002",
            passengers: Math.floor(Math.random() * 10),
          }),
        },
      ],
      () => {}
    );
  });
});
