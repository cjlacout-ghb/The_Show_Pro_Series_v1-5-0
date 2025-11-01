
"use client";

import { useState, useCallback, useEffect } from "react";
import type { Team, Game, Standing } from "@/lib/types";
import { SoftballIcon } from "@/components/icons";
import TeamSetup from "@/components/team-setup";
import ScheduleCard from "@/components/schedule-card";
import StandingsTable from "@/components/standings-table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

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

export default function Home() {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [preliminaryGames, setPreliminaryGames] = useState<Game[]>(initialGames);
  const [championshipGame, setChampionshipGame] = useState<Game>(initialChampionshipGame);
  const [standings, setStandings] = useState<Standing[]>(() =>
    initialTeams.map((team) => ({
      teamId: team.id,
      pos: 0,
      w: 0,
      l: 0,
      rs: 0,
      ra: 0,
      pct: 0,
      gb: 0,
    }))
  );
  const { toast } = useToast();

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

  const calculateStandings = useCallback(() => {
    const newStandings: Omit<Standing, "pos" | "gb">[] = teams.map(team => ({
      teamId: team.id,
      w: 0,
      l: 0,
      rs: 0,
      ra: 0,
      pct: 0,
    }));

    preliminaryGames.forEach(game => {
      if (game.team1Id && game.team2Id && game.score1 !== "" && game.score2 !== "") {
        const team1Id = parseInt(game.team1Id);
        const team2Id = parseInt(game.team2Id);
        const score1 = parseInt(game.score1);
        const score2 = parseInt(game.score2);

        const standing1 = newStandings.find(s => s.teamId === team1Id);
        const standing2 = newStandings.find(s => s.teamId === team2Id);

        if (standing1 && standing2) {
          standing1.rs += score1;
          standing1.ra += score2;
          standing2.rs += score2;
          standing2.ra += score1;

          if (score1 > score2) {
            standing1.w++;
            standing2.l++;
          } else if (score2 > score1) {
            standing2.w++;
            standing1.l++;
          }
        }
      }
    });

    newStandings.forEach(standing => {
      const gamesPlayed = standing.w + standing.l;
      standing.pct = gamesPlayed > 0 ? Math.round((standing.w / gamesPlayed) * 1000) : 0;
    });

    newStandings.sort((a, b) => b.w - a.w || a.l - b.l || (b.rs - b.ra) - (a.rs - a.ra));

    const firstPlaceWins = newStandings.length > 0 ? newStandings[0].w : 0;
    const firstPlaceLosses = newStandings.length > 0 ? newStandings[0].l : 0;

    const finalStandings: Standing[] = newStandings.map((standing, index) => {
      const gamesBehind = ((firstPlaceWins - standing.w) + (standing.l - firstPlaceLosses)) / 2;
      return {
        ...standing,
        pos: index + 1,
        gb: index === 0 ? 0 : gamesBehind,
      };
    });

    setStandings(finalStandings);
    toast({
      title: "Posiciones Actualizadas",
      description: "Las posiciones se han recalculado con los últimos resultados.",
    });

  }, [preliminaryGames, teams, toast]);


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
            <TeamSetup teams={teams} />
            <StandingsTable
              teams={teams}
              standings={standings}
            />
          </div>
          <div className="xl:col-span-3 space-y-8">
            <ScheduleCard
              title="Ronda Inicial"
              games={preliminaryGames}
              teams={teams}
              onGameChange={(gameId, field, value) => handleGameChange(gameId, field, value, false)}
              gameCount={15}
              footer={
                <div className="flex justify-end pt-4">
                  <Button onClick={calculateStandings}>Guardar Resultados y Actualizar Posiciones</Button>
                </div>
              }
            />
            <ScheduleCard
              title="Partido Final"
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
