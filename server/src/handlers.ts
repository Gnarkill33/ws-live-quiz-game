import { User } from "./types";

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
