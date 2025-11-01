"use client";

import { useState } from "react";
import type { Team, Game, Standing } from "@/lib/types";
import { SoftballIcon } from "@/components/icons";
import TeamSetup from "@/components/team-setup";
import ScheduleCard from "@/components/schedule-card";
import StandingsTable from "@/components/standings-table";

const initialTeams: Team[] = [
  { id: 1, name: "ACCIN VORTEX (ARG)" },
  { id: 2, name: "CACIQUES BY SWING (CHI)" },
  { id: 3, name: "CITY PAN (CHI)" },
  { id: 4, name: "MAYO'S (MEX)" },
  { id: 5, name: "SOUTH ARGENTINA (ARG)" },
  { id: 6, name: "TEAM FINCA JUJURE (VEN)" },
];

const initialGames: Game[] = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  team1Id: "",
  score1: "",
  team2Id: "",
  score2: "",
}));

const initialChampionshipGame: Game = {
  id: 1,
  team1Id: "",
  score1: "",
  team2Id: "",
  score2: "",
};

const initialStandings: Standing[] = initialTeams.map((team, index) => ({
  teamId: team.id,
  pos: (index + 1).toString(),
  w: "0",
  l: "0",
  rs: "0",
  ra: "0",
  pct: ".000",
  gb: "-",
}));

export default function Home() {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [preliminaryGames, setPreliminaryGames] = useState<Game[]>(initialGames);
  const [championshipGame, setChampionshipGame] = useState<Game>(initialChampionshipGame);
  const [standings, setStandings] = useState<Standing[]>(initialStandings);

  const handleTeamNameChange = (id: number, newName: string) => {
    setTeams((prevTeams) =>
      prevTeams.map((team) => (team.id === id ? { ...team, name: newName } : team))
    );
  };

  const handleGameChange = (
    gameId: number,
    field: keyof Game,
    value: string,
    isChampionship = false
  ) => {
    const updater = isChampionship ? setChampionshipGame : setPreliminaryGames;
    updater((prevState: any) => {
      if (isChampionship) {
        return { ...prevState, [field]: value };
      }
      return prevState.map((game: Game) =>
        game.id === gameId ? { ...game, [field]: value } : game
      );
    });
  };

  const handleStandingChange = (teamId: number, field: keyof Omit<Standing, 'teamId'>, value: string) => {
    setStandings(prevStandings =>
      prevStandings.map(standing =>
        standing.teamId === teamId ? { ...standing, [field]: value } : standing
      )
    );
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <header className="mb-10">
          <div className="flex items-center gap-4">
            <SoftballIcon className="w-12 h-12 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">
                Softball Showdown Central
              </h1>
              <p className="text-muted-foreground">THE SHOW PRO SERIES TOURNAMENT</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          <div className="xl:col-span-2 space-y-8">
            <TeamSetup teams={teams} onTeamNameChange={handleTeamNameChange} />
            <StandingsTable
              teams={teams}
              standings={standings}
              onStandingChange={handleStandingChange}
            />
          </div>
          <div className="xl:col-span-3 space-y-8">
            <ScheduleCard
              title="Preliminary Round"
              games={preliminaryGames}
              teams={teams}
              onGameChange={(gameId, field, value) => handleGameChange(gameId, field, value, false)}
              gameCount={15}
            />
            <ScheduleCard
              title="Championship Game"
              games={[championshipGame]}
              teams={teams}
              onGameChange={(gameId, field, value) => handleGameChange(gameId, field, value, true)}
              gameCount={1}
            />
          </div>
        </div>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground">
        Built for the love of the game.
      </footer>
    </div>
  );
}
