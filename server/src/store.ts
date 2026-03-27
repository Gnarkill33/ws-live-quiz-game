import { randomUUID } from "crypto";
import {
 CreateGameData,
 Game,
 JoinGameData,
 RegData,
 StartGameData,
 User,
 WebSocketWithId,
 WSMessage,
} from "./types";
import { generateGameCode } from "./utils";

class Players {
 private players = new Map();
 private playerIndex = 0;

 addPlayer(player: RegData, ws: WebSocketWithId): User {
  const newPlayer = { ...player, ws: ws, index: String(this.playerIndex++) };
  this.players.set(player.name, newPlayer);

  return newPlayer;
 }

 getPlayerByWsId(ws: WebSocketWithId) {
  for (const player of this.players.values()) {
   if (player.ws.id === ws.id) {
    return player;
   }
  }
 }
}

export const playerStore = new Players();

class Games {
 private games = new Map();

 createGame(data: CreateGameData, ws: WebSocketWithId) {
  const gameId = randomUUID();
  const code = generateGameCode();

  const newGame: Game = {
   id: gameId,
   code: code,
   hostId: ws.id,
   hostWs: ws,
   questions: data.questions,
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

 findGameByCode(gameCode: string): Game | null {
  for (const game of this.games.values()) {
   if (game.code === gameCode) {
    return game;
   }
  }
  return null;
 }

 findGameById(gameId: string): Game | null {
  for (const game of this.games.values()) {
   if (game.id === gameId) {
    return game;
   }
  }
  return null;
 }

 findGameHost(gameId: string) {
  const game = this.findGameById(gameId);
  return game?.hostWs;
 }

 joinGame(data: JoinGameData, ws: WebSocketWithId) {
  const gameToJoin = this.findGameByCode(data.code);
  const existingPlayer = playerStore.getPlayerByWsId(ws);

  if (!gameToJoin) return null;

  gameToJoin.players.push(existingPlayer);

  existingPlayer.score = 0;

  gameToJoin.playerAnswers.set(existingPlayer.name, {
   answerIndex: 0,
   timestamp: 0,
  });

  return gameToJoin;
 }

 startGame(data: StartGameData, ws: WebSocketWithId) {
  const gameStarted = this.findGameById(data.gameId);
  if (gameStarted) gameStarted.status = "in_progress";
  return gameStarted;
 }
}

export const gameStore = new Games();
