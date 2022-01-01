import { createServer } from "net";
import { action } from "tx2";

let self;

class Server {
  constructor(opts) {
    this.server = null;
    this.port = opts.port;

    this.connectCallback = opts.connectCallback;
    this.dataCallback = opts.dataCallback;
    this.timeoutCallback = opts.timeoutCallback;
    this.disconnectCallback = opts.disconnectCallback;

    this.outboundQueue = opts.outboundQueueInstance;
    this.outboundQueue.process(opts.outboundProcess);
    this.outboundQueue
      .on("completed", (job, _result) => job.remove())
      .on("failed", (job, _err) => job.remove());

    self = this;

    this.start = () => {
      this.server = createServer();
      this.server.on("listening", _onListen);
      this.server.on("err", _onErr);
      this.server.on("close", _onClose);
      this.server.on("connection", _onConnect);

      this.sockets = [];
      this.server.listen(this.port);
    };

    this.stop = () => {
      if (this.server) {
        this.server.close();
        if (this.sockets.length > 0) {
          this.sockets.forEach(socket => socket.destroy());
        }
      }
    };

    this.getClientSocket = clientId => {
      for (const socket of this.sockets) {
        if (socket.clientId === Number(clientId)) return socket;
      }
      return null;
    };

    function _onListen () {
      console.log(`server listening on port ${self.port}`);
    }

    function _onErr (err) {
      console.error(`server error`);
      console.error(err);

      self.server.close();
      if (self.sockets.length > 0) {
        self.sockets.forEach(socket => socket.destroy());
      }
    }

    // server will only emit "close" event when all connections are closed
    // connections must be manually closed when server.close() is called
    function _onClose () {
      setTimeout(() => self.start(), 1000);
    }

    function _onConnect (socket) {
      socket.buffer = [];
      socket.alive = 10;
      socket.setTimeout(1000);

      socket.on("data", data => {
        console.log(`socket ${socket.remotePort} sent: ${data.toString()}`);

        const chars = data.toString().split("");
        chars.forEach(char => socket.buffer.push(char));

        while (socket.buffer.length >= 4) self.dataCallback(socket);
      });

      socket.on("timeout", () => {
        self.timeoutCallback(socket, err => {
          if (err) {
            console.error(err);
            return socket.destroy();
          }
        });
      });

      socket.on("error", err => {
        console.error(`error in socket on port ${socket.remotePort}`);
        console.error(err);
      });

      socket.on("close", hadErr => {
        const idx = self.sockets.indexOf(socket);
        self.sockets.splice(idx, 1);
        self.disconnectCallback(socket);
      });

      self.sockets.push(socket);
      self.connectCallback(socket);
    }

    action("socketcount", cb => cb(self.sockets.length));
  }
}

export default Server;