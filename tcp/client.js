import { connect } from "net";

let self;

class Client {
  constructor(opts) {
    this.serverPort = opts.serverPort;
    this.serverIp = opts.serverIp;
    this.clientId = opts.clientId;

    this.socket = null;

    this.readyCallback = opts.readyCallback;
    this.dataCallback = opts.dataCallback;
    this.timeoutCallback = opts.timeoutCallback;
    this.errorCallback = opts.errorCallback;
    this.endCallback = opts.endCallback;
    this.closeCallback = opts.closeCallback;

    self = this;

    this.connect = () => {
      this.socket = connect(this.serverPort, this.serverIp);
      this.socket.buffer = [];

      this.socket.on("ready", _onReady);
      this.socket.on("data", _onData);
      this.socket.on("timeout", _onTimeout);
      this.socket.on("error", _onError);
      this.socket.on("end", _onEnd);
      this.socket.on("close", _onClose);
    };

    function _onReady (socket) {
      socket.alive = 10;
      socket.setTimeout(1000);
      self.readyCallback();
    }

    function _onData (socket, data) {
      console.log(`server sent: ${data.toString()}`);

      const chars = data.toString().split("");
      chars.forEach(char => socket.buffer.push(char));

      while (socket.buffer.length >= 4) self.dataCallback();
    }

    function _onTimeout (socket) {
      self.timeoutCallback(err => {
        if (err) {
          console.log(err);
          socket.destroy();
        }
      })
    }

    function _onError (socket, err) {
      self.errorCallback(err);
    }

    function _onEnd (socket) {
      self.endCallback();
    }

    function _onClose (socket, hadErr) {
      self.closeCallback();
    }
  }
}

export default Client;