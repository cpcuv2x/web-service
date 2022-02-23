import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("connected");
});
socket.on("car_passengers", (x) => console.log("car_passengers", x));
socket.on("car_position", (x) => console.log("car_position", x));
socket.on("disconnect", () => {
  console.log("disconnected");
});
