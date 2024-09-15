import { WebSocketServer } from "ws";
import { createClient } from "redis";
import uniqid from "uniqid";
import watcherInstance from "./watcher.js";

watcherInstance.main();

const wss = new WebSocketServer({ port: 8080 });

const publishClient = createClient();
publishClient.connect();

const subscribeClient = createClient();
subscribeClient.connect();

const users = new Map();

const redisCallbackHandler = (incomingMsg) => {
  [...users.keys()].forEach((client) => {
    client.send(incomingMsg);
  });
};

wss.on("connection", (ws) => {
  ws.on("error", console.error);

  ws.on("message", (data) => {
    const stringData = data.toString();
    const parsedData = JSON.parse(stringData);

    if (parsedData.type === "SUBSCRIBE") {
      const id = uniqid();
      users.set(ws, id);
      if (users.size === 1) {
        console.log("Subscribing to pub sub");
        subscribeClient.subscribe("room1", redisCallbackHandler);
      }
      console.log("total users: ", users.size);
      const last10lines = watcherInstance.getLastLines();
      ws.send(last10lines);
    }
  });

  ws.on("close", () => {
    users.delete(ws);
    if (users.size === 0) {
      console.log("Unsubscribing from pubsub");
      subscribeClient.unsubscribe("room1");
    }
    console.log("total users: ", users.size);
  });
});
