import { Game, User } from "./types";

export const createRegResponse = (player: User) => ({
 type: "reg",
 data: {
  name: player.name,
  index: player.index,
  error: false,
  errorText: "",
 },
 id: 0,
});

export const createNewGameResponse = (game: Game) => ({
 type: "game_created",
 data: {
  gameId: game.id,
  code: game.code,
 },
 id: 0,
});

export const generateGameCode = () => {
 const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
 let code = "";
 for (let i = 0; i < 6; i++) {
  code += chars[Math.floor(Math.random() * chars.length)];
 }
 return code;
};
