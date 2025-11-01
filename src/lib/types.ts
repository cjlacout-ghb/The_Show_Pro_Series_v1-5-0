
export type Team = {
  id: number;
  name: string;
};

export type Game = {
  id: number;
  team1Id: string;
  score1: string;
  team2Id: string;
  score2: string;
};

export type Standing = {
  teamId: number;
  pos: number;
  w: number;
  l: number;
  rs: number;
  ra: number;
  pct: number;
  gb: number;
};
