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
  pos: string;
  w: string;
  l: string;
  rs: string;
  ra: string;
  pct: string;
  gb: string;
};
