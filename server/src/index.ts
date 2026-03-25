import { WebSocketServer } from "ws";
import { gameStore, playerStore } from "./store";
import { WebSocketWithId, WSMessage } from "./types";
import { createNewGameResponse, createRegResponse } from "./utils";
import { randomUUID } from "crypto";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// WebSocket server
const wss = new WebSocketServer({ port: PORT });

wss.on("listening", () => {
 console.log(`Websocket server started on port ${PORT}`);
});

wss.on("connection", (ws: WebSocketWithId) => {
 ws.id = randomUUID();
 ws.on("error", console.error);

 console.log(`User ${ws.id} joined the server`);

 ws.on("error", console.error);

 ws.on("message", async (message) => {
  try {
   const parsedMessage = JSON.parse(message.toString());
   const response = await handleIncomingMessage(parsedMessage, ws);

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

export const handleIncomingMessage = async (
 message: WSMessage,
 ws: WebSocketWithId,
) => {
 const { type, data } = message;

 const parsedData = typeof data === "string" ? JSON.parse(data) : data;

 switch (type) {
  case "reg":
   const registeredPlayer = playerStore.addPlayer(parsedData);
   return createRegResponse(registeredPlayer);
  case "create_game":
   const newGame = gameStore.createGame(parsedData, ws);
   return createNewGameResponse(newGame);
 }
};
