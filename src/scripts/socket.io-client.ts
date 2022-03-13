import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("connected");
  socket.emit("START_STREAM_MAP_CARS", ["CAR-1", "CAR-2"], (id: any) => {
    socket.on(id, (x: any) => console.log("this will render on map!", x));
  });
  socket.emit("START_STREAM_CAR_INFORMATION", "CAR-1", (id: any) => {
    socket.on(id, (x: any) =>
      console.log("this will render on car info card!", x)
    );
  });
});
socket.on("disconnect", () => {
  console.log("disconnected");
});
