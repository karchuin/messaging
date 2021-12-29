import { waterfall } from "async";

import Server from "./tcp/server";
import opcode from "./common/config/opcode.json";
import { serverPort } from "./common/config/default.json";
import { now, getData, formData } from "./common/util";
import serverQueue from "./queue/server";

const server = new Server(
  {
    port: serverPort,
    connectCallback: connectCallback,
    dataCallback: dataCallback,
    timeoutCallback: timeoutCallback,
    disconnectCallback: disconnectCallback
  }
);

server.start();

function connectCallback (socket) {
  socket.clientId = 0;
  socket.ack_typing = -1;
  console.log(`socket connected, port: ${socket.remotePort}`);
}

function dataCallback (socket) {
  let payload;
  let buffer = socket.buffer;

  while (buffer.length >= 4) {
    const tmp = buffer.slice(0, 4).join("");

    switch (tmp) {
      case opcode.ping:
        _socketWrite(socket, opcode.pingAck);
        buffer.splice(0, 4);
        break;

      case opcode.pingAck:
        socket.alive = 10;
        buffer.splice(0, 4);
        break;

      case opcode.typing:
        payload = getData(buffer);
        if (payload === null) return;

        socket.alive = 10;
        socket.ack_typing = 5;
        _socketWrite(socket, formData(opcode.typingAck, payload));

        buffer.splice(0, 7 + payload.length);
        break;

      case opcode.typingStopped:
        payload = getData(buffer);
        if (payload === null) return;

        socket.alive = 10;
        socket.ack_typing = -1;
        _socketWrite(socket, formData(opcode.typingStoppedAck, payload));

        buffer.splice(0, 7 + payload.length);
        break;

      case opcode.regClient:
        payload = getData(buffer);
        if (payload === null) return;

        socket.alive = 10;
        socket.clientId = payload;
        _socketWrite(socket, formData(opcode.regClientAck));

        serverQueue.add({
          opcode: tmp,
          clientId: payload
        });

        buffer.splice(0, 7 + payload.length);
        break;

      default:
        console.log(`unknown opcode received: ${tmp}`);
        return socket.destroy();
    }
  }
}

function timeoutCallback (socket, callback) {
  waterfall([
    cb => {
      if (socket.alive <= 0) return cb(`socket on port ${socket.remotePort} timed out`);

      _socketWrite(socket, opcode.ping);
      socket.alive--;
      cb();
    },
    cb => {
      if (socket.ack_typing <= 0) return cb();

      _socketWrite(socket, opcode.typingAck);
      socket.ack_typing--;
      if (socket.ack_typing === 0) _socketWrite(socket, opcode.typingStopped);
      cb();
    },
    cb => {

    }
  ], callback);
}

function disconnectCallback (socket) {
  console.log(`socket disconnected, port: ${socket.remotePort}`);
}

function _socketWrite (socket, data) {
  if (socket?.readyState === "open") socket.write(data);
}

process.on("SIGINT", () => {
  console.log("exiting process");

  if (server.server) server.stop();
  setTimeout(() => process.exit(0), 1000);
});