import { Game, User, WebSocketWithId } from "./types";

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

export const createJoinedGameResponse = (game: Game, ws: WebSocketWithId) => ({
 type: "game_joined",
 data: {
  gameId: game.id,
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

export const calculatePoints = ({
 isCorrect,
 timeRemaining,
 timeLimit,
 basePoints,
}: {
 isCorrect: boolean;
 timeRemaining: number;
 timeLimit: number;
 basePoints: number;
}) => {
 if (!isCorrect) return 0;

 if (timeLimit <= 0) return 0;

 const clampedTime = Math.max(0, Math.min(timeRemaining, timeLimit));

 const ratio = clampedTime / timeLimit;

 return Math.floor(basePoints * ratio);
};

export const buildQuestionMessage = (game: Game) => {
 const question = game.questions[game.currentQuestion];

 return {
  type: "question",
  data: {
   questionNumber: game.currentQuestion,
   totalQuestions: game.questions.length,
   text: question.text,
   options: question.options,
   timeLimitSec: question.timeLimitSec,
  },
  id: 0,
 };
};

export const sendErrorMessage = (ws: WebSocketWithId, message: string) => {
 const errorMessage = { type: "error", data: { message }, id: 0 };

 ws.send(JSON.stringify(errorMessage));
};
