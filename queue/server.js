import Queue from "bull";

import opcode from "../common/config/opcode.json";

const serverQueue = new Queue("bull");
const outboundQueue = new Queue("server-outbound-queue");

serverQueue
  .on("completed", (job, result) => job.remove())
  .on("failed", (job, err) => job.remove());

function _regClient (data, done) {
  const clientId = data.clientId;
  done();
}

serverQueue.process((job, done) => {
  const data = job.data;

  switch (data.opcode) {
    case opcode.regClient:
      _regClient(data, done);
      break;
  }
});

export { serverQueue as default };