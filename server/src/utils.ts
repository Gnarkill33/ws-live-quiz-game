import { Game, User, WebSocketWithId } from "./types";

export const createRegResponse = (player: User, ws: WebSocketWithId) => ({
 response: {
  type: "reg",
  data: {
   name: player.name,
   index: player.index,
   error: false,
   errorText: "",
  },
  id: 0,
 },
 target: ws,
});

export const createNewGameResponse = (game: Game, ws: WebSocketWithId) => ({
 response: {
  type: "game_created",
  data: {
   gameId: game.id,
   code: game.code,
  },
  id: 0,
 },
 target: ws,
});

export const createJoinedGameResponse = (game: Game, ws: WebSocketWithId) => ({
 response: {
  type: "game_joined",
  data: {
   gameId: game.id,
  },
  id: 0,
 },
 target: ws,
});

export const generateGameCode = () => {
 const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
 let code = "";
 for (let i = 0; i < 6; i++) {
  code += chars[Math.floor(Math.random() * chars.length)];
 }
 return code;
};
