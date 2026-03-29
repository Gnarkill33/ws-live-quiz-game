import { WebSocketServer } from "ws";
import { gameStore, playerStore } from "./store";
import { Game, WebSocketWithId, WSMessage } from "./types";
import {
 buildQuestionMessage,
 calculatePoints,
 createJoinedGameResponse,
 createNewGameResponse,
 createRegResponse,
 sendErrorMessage,
} from "./utils";
import { randomUUID } from "crypto";

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// WebSocket server
const wss = new WebSocketServer({ port: PORT });

wss.on("listening", () => {
 console.log(`Websocket server started on port ${PORT}`);
});

wss.on("connection", (ws: WebSocketWithId) => {
 ws.id = randomUUID();

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
   sendErrorMessage(ws, "Invalid message format");
  }
 });

 ws.on("close", () => {
  console.log(`User ${ws.id} disconnected`);
  handleDisconnect(ws);
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
   const registeredPlayer = playerStore.addPlayer(parsedData, ws);
   return createRegResponse(registeredPlayer);

  case "create_game":
   const newGame = gameStore.createGame(parsedData, ws);
   return createNewGameResponse(newGame);

  case "join_game":
   const gameJoined = gameStore.joinGame(parsedData, ws);

   if (!gameJoined) {
    return sendErrorMessage(ws, "Game not found or cannot join");
   }

   broadcastPlayerJoined(gameJoined, ws);
   broadcastUpdatePlayers(gameJoined);
   return createJoinedGameResponse(gameJoined, ws);

  case "start_game":
   const gameStarted = gameStore.startGame(parsedData, ws);

   if (!gameStarted) {
    return sendErrorMessage(ws, "Cannot start game");
   }

   const message = buildQuestionMessage(gameStarted);

   broadcastToGame(gameStarted.id, message);
   break;

  case "answer":
   const gameFound = gameStore.findGameById(parsedData.gameId);

   if (!gameFound) {
    return sendErrorMessage(ws, "Game not found");
   }

   const playerFound = playerStore.getPlayerByWsId(ws);

   if (!playerFound) {
    return sendErrorMessage(ws, "Player not registered");
   }

   const playerAnswered = gameFound?.players.find(
    (player) => player.name === playerFound.name,
   );

   if (!playerAnswered) {
    return sendErrorMessage(ws, "Player not in this game");
   }

   gameFound?.playerAnswers.set(playerAnswered?.name, {
    answerIndex: parsedData.answerIndex,
    timestamp: Date.now(),
   });

   playerAnswered.hasAnswered = true;

   const messageToSend = {
    type: "answer_accepted",
    data: {
     questionIndex: gameFound.currentQuestion,
    },
    id: 0,
   };

   const allAnswered = gameFound.players.every((player) => player.hasAnswered);

   if (!allAnswered) return;

   const results = gameFound.players.map((player) => {
    const answer = gameFound.playerAnswers.get(player.name);

    if (!answer) {
     return {
      name: player.name,
      answered: false,
      isCorrect: false,
      pointsEarned: 0,
      totalScore: player.score,
     };
    }

    const isCorrect =
     answer?.answerIndex ===
     gameFound.questions[gameFound.currentQuestion].correctIndex;

    const now = Date.now();
    const timeSpent = now - answer.timestamp;
    const timeRemaining =
     gameFound.questions[gameFound.currentQuestion].timeLimitSec - timeSpent;

    const points = isCorrect
     ? calculatePoints({
        isCorrect,
        timeRemaining,
        timeLimit: gameFound.questions[gameFound.currentQuestion].timeLimitSec,
        basePoints: 1000,
       })
     : 0;

    player.score += points;

    return {
     name: player.name,
     answered: !!answer,
     isCorrect,
     pointsEarned: points,
     totalScore: player.score,
    };
   });

   const messageToAll = {
    type: "question_result",
    data: {
     questionIndex: gameFound.currentQuestion,
     correctIndex: gameFound.questions[gameFound.currentQuestion].correctIndex,
     playerResults: results,
    },
    id: 0,
   };

   ws.send(JSON.stringify(messageToSend));
   broadcastToGame(gameFound.id, messageToAll);

   const isLastQuestion =
    gameFound.currentQuestion >= gameFound.questions.length - 1;

   if (isLastQuestion) {
    finishGame(gameFound);
   } else {
    goToNextQuestion(gameFound);
   }
   break;

  default:
   return sendErrorMessage(ws, "Unknown message type");
 }
};

function broadcastToGame(gameId: string, message: WSMessage) {
 const game = gameStore.findGameById(gameId);
 if (!game) return;

 const gameHost = gameStore.findGameHost(game.id);
 gameHost?.send(JSON.stringify(message));

 for (const player of game.players) {
  player.ws.send(JSON.stringify(message));
 }
}

function broadcastPlayerJoined(game: Game, ws: WebSocketWithId) {
 const playerJoined = playerStore.getPlayerByWsId(ws);

 const message = {
  type: "player_joined",
  data: {
   playerName: playerJoined.name,
   playerCount: game.players.length,
  },
  id: 0,
 };

 broadcastToGame(game.id, message);
}

function broadcastUpdatePlayers(game: Game) {
 const playersData = game.players.map((player) => ({
  name: player.name,
  index: player.index,
  score: player.score || 0,
 }));

 const message = {
  type: "update_players",
  data: playersData,
  id: 0,
 };

 broadcastToGame(game.id, message);
}

function goToNextQuestion(game: Game) {
 game.currentQuestion += 1;

 game.playerAnswers.clear();

 game.players.forEach((player) => {
  player.hasAnswered = false;
 });

 broadcastToGame(game.id, buildQuestionMessage(game));
}

function finishGame(game: Game) {
 const scoreboard = game.players
  .map((player) => ({
   name: player.name,
   score: player.score,
  }))
  .sort((a, b) => b.score - a.score)
  .map((player, index) => ({
   ...player,
   rank: index + 1,
  }));

 broadcastToGame(game.id, {
  type: "game_finished",
  data: {
   scoreboard,
  },
  id: 0,
 });
}

function handleDisconnect(ws: WebSocketWithId) {
 const player = playerStore.getPlayerByWsId(ws);
 if (!player) return;

 const game = gameStore.findGameByPlayer(player.name);
 if (!game) return;

 game.players = game.players.filter((p) => p.name !== player.name);

 game.playerAnswers.delete(player.name);

 playerStore.removePlayer(player);

 broadcastUpdatePlayers(game);
}
