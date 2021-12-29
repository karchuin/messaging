import Client from "./tcp/client";
import opcode from "./common/config/opcode.json";

let socket;

const client = new Client(
  {
    readyCallback: readyCallback,
    dataCallback: dataCallback,
    timeoutCallback: timeoutCallback,
    errorCallback: errorCallback,
    endCallback: endCallback,
    closeCallback: closeCallback
  }
);

client.connect();

function readyCallback () {
  socket = client.socket;
  console.log("connected to server");
}

function dataCallback (data) {
  let buffer = socket.buffer;

  while (buffer.length >= 4) {
    const tmp = buffer.slice(0, 4).join("");

    switch (tmp) {
      case opcode.ping:
        socket.write(pingAck);
        buffer.splice(0, 4);
        break;

      case opcode.pingAck:
        socket.alive = 10;
        buffer.splice(0, 4);
        break;

      default:
        console.log(`unknown opcode received: ${tmp}`);
        return socket.destroy();
    }
  }
}

function timeoutCallback (callback) {

}

function errorCallback (err, callback) {

}

function endCallback () {

}

function closeCallback () {

}

function _socketWrite (data) {
  if (socket?.readyState === "open") socket.write(data);
}