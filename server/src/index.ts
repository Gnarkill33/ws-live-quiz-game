import { WebSocketServer } from "ws";
import { playerStore } from "./store";
import { WSMessage } from "./types";
import { createRegResponse } from "./handlers";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// WebSocket server
const wss = new WebSocketServer({ port: PORT });

wss.on("listening", () => {
 console.log(`Websocket server started on port ${PORT}`);
});

wss.on("connection", (ws) => {
 console.log("New client connected");

 ws.on("error", console.error);

 ws.on("message", async (message) => {
  try {
   const parsedMessage = JSON.parse(message.toString());
   const response = await handleIncomingMessage(parsedMessage);

   if (response) {
    ws.send(JSON.stringify(response));
   }
  } catch (error) {
   console.error(error);
  }
 });

 ws.on("close", () => {
  console.log("Client disconnected");
 });
});

export const handleIncomingMessage = async (message: WSMessage) => {
 const { type, data } = message;

 const parsedData = typeof data === "string" ? JSON.parse(data) : data;

 switch (type) {
  case "reg":
   const registeredPlayer = playerStore.addPlayer(parsedData);
   return createRegResponse(registeredPlayer);
 }
};
