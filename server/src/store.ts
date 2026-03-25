import { randomUUID } from "crypto";
import { Game, Question, RegData, WebSocketWithId } from "./types";
import { generateGameCode } from "./utils";

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

class Games {
 private games = new Map();

 createGame(questions: Question[], ws: WebSocketWithId) {
  const gameId = randomUUID();
  const code = generateGameCode();

  const newGame: Game = {
   id: gameId,
   code: code,
   hostId: ws.id,
   questions: questions,
   players: [],
   currentQuestion: 0,
   status: "waiting",
   questionStartTime: undefined,
   questionTimer: undefined,
   playerAnswers: new Map(),
  };

  this.games.set(gameId, newGame);

  return newGame;
 }
}

export const gameStore = new Games();
