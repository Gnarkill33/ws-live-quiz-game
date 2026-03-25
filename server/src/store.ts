import { RegData } from "./types";

class Players {
 private players = new Map();
 private playerIndex = 0;

 addPlayer(player: RegData) {
  const newPlayer = { ...player, index: String(this.playerIndex++) };
  this.players.set(player.name, newPlayer);

  return newPlayer;
 }
}

export const playerStore = new Players();
