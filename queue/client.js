import Queue from "bull";

import opcode from "../common/config/opcode.json";

const clientQueue = new Queue("client-queue");
const outboundQueue = new Queue("client-outbound-queue");

clientQueue
  .on("completed", (job, result) => job.remove())
  .on("failed", (job, err) => job.remove());

clientQueue.process((job, done) => {
  const data = job.data;

  
});

export { clientQueue as default };