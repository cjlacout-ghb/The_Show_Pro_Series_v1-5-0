
"use client";

import { useState, useCallback, useEffect } from "react";
import type { Team, Game, Standing } from "@/lib/types";
import { SoftballIcon, TrophyIcon } from "@/components/icons";
import TeamSetup from "@/components/team-setup";
import ScheduleCard from "@/components/schedule-card";
import StandingsTable from "@/components/standings-table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const initialTeams: Team[] = [
  { id: 1, name: "ACCIN VORTEX (ARG)" },
  { id: 2, name: "CACIQUES BY SWING (CHI)" },
  { id: 3, name: "CITY PAN (CHI)" },
  { id: 4, name: "MAYO'S (MEX)" },
  { id: 5, name: "SOUTH ARGENTINA (ARG)" },
  { id: 6, name: "TEAM FINCA JUJURE (VEN)" },
];

const initialGames: Game[] = [
    // DÍA 1: Miércoles, 18 de marzo
    { id: 1, team1Id: "2", score1: "", team2Id: "4", score2: "", day: "DÍA 1: Miércoles, 18 de marzo", time: "10:15" },
    { id: 2, team1Id: "1", score1: "", team2Id: "6", score2: "", day: "DÍA 1: Miércoles, 18 de marzo", time: "13:15" },
    { id: 3, team1Id: "3", score1: "", team2Id: "5", score2: "", day: "DÍA 1: Miércoles, 18 de marzo", time: "16:15" },
    { id: 4, team1Id: "1", score1: "", team2Id: "5", score2: "", day: "DÍA 1: Miércoles, 18 de marzo", time: "21:00" },
    // DÍA 2: Jueves, 19 de marzo
    { id: 5, team1Id: "3", score1: "", team2Id: "6", score2: "", day: "DÍA 2: Jueves, 19 de marzo", time: "10:15" },
    { id: 6, team1Id: "2", score1: "", team2Id: "5", score2: "", day: "DÍA 2: Jueves, 19 de marzo", time: "13:15" },
    { id: 7, team1Id: "4", score1: "", team2Id: "1", score2: "", day: "DÍA 2: Jueves, 19 de marzo", time: "16:15" },
    { id: 8, team1Id: "3", score1: "", team2Id: "2", score2: "", day: "DÍA 2: Jueves, 19 de marzo", time: "21:00" },
    // DÍA 3: Viernes, 20 de marzo
    { id: 9, team1Id: "5", score1: "", team2Id: "6", score2: "", day: "DÍA 3: Viernes, 20 de marzo", time: "10:15" },
    { id: 10, team1Id: "4", score1: "", team2Id: "3", score2: "", day: "DÍA 3: Viernes, 20 de marzo", time: "13:15" },
    { id: 11, team1Id: "2", score1: "", team2Id: "1", score2: "", day: "DÍA 3: Viernes, 20 de marzo", time: "16:15" },
    { id: 12, team1Id: "6", score1: "", team2Id: "4", score2: "", day: "DÍA 3: Viernes, 20 de marzo", time: "21:00" },
    // DÍA 4: Sábado, 21 de marzo
    { id: 13, team1Id: "1", score1: "", team2Id: "3", score2: "", day: "DÍA 4: Sábado, 21 de marzo", time: "12:00" },
    { id: 14, team1Id: "6", score1: "", team2Id: "2", score2: "", day: "DÍA 4: Sábado, 21 de marzo", time: "15:00" },
    { id: 15, team1Id: "5", score1: "", team2Id: "4", score2: "", day: "DÍA 4: Sábado, 21 de marzo", time: "18:00" },
];


const initialChampionshipGame: Game = {
  id: 16,
  team1Id: "",
  score1: "",
  team2Id: "",
  score2: "",
  day: "DÍA 4: Sábado, 21 de marzo",
  time: "21:00",
};

export default function Home() {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [preliminaryGames, setPreliminaryGames] = useState<Game[]>(initialGames);
  const [championshipGame, setChampionshipGame] = useState<Game>(initialChampionshipGame);
  const [champion, setChampion] = useState<string | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);

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
  
  useEffect(() => {
    // Initial calculation on mount
    calculateStandings();
  }, [calculateStandings]);

  useEffect(() => {
    if (standings.length > 1) {
      setChampionshipGame(prev => ({
        ...prev,
        team1Id: String(standings[0].teamId),
        team2Id: String(standings[1].teamId)
      }));
    }
  }, [standings]);
  
  const handleSaveChampionship = () => {
    const { team1Id, team2Id, score1, score2 } = championshipGame;
    if (score1 !== "" && score2 !== "") {
      const s1 = parseInt(score1);
      const s2 = parseInt(score2);
      let winnerId;
      if (s1 > s2) {
        winnerId = team1Id;
      } else if (s2 > s1) {
        winnerId = team2Id;
      }
      
      if (winnerId) {
        const winner = teams.find(t => String(t.id) === winnerId);
        if (winner) {
          setChampion(winner.name);
          toast({
            title: "¡Campeón Definido!",
            description: `El equipo campeón es ${winner.name}.`
          });
        }
      } else {
         setChampion(null);
         toast({
            title: "Resultado de Partido Final",
            description: "El partido ha terminado en empate."
          });
      }
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Por favor, ingrese ambos marcadores para definir el campeón."
      })
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <header className="mb-10">
          <div className="flex items-center gap-4">
            <SoftballIcon className="w-12 h-12 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">
                Central de Softball Showdown
              </h1>
              <p className="text-muted-foreground">TORNEO THE SHOW PRO SERIES</p>
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
            {champion && (
              <Card className="bg-card border-ring ring-2 ring-ring shadow-lg animate-in fade-in-50">
                <CardHeader className="items-center text-center">
                  <TrophyIcon className="w-16 h-16 text-ring" />
                  <CardTitle className="text-2xl text-ring">¡Equipo Campeón!</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-3xl font-bold tracking-wider text-foreground">{champion}</p>
                </CardContent>
              </Card>
            )}
          </div>
          <div className="xl:col-span-3 space-y-8">
            <ScheduleCard
              title="Ronda Inicial"
              games={preliminaryGames}
              teams={teams}
              onGameChange={(gameId, field, value) => handleGameChange(gameId, field, value, false)}
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
              footer={
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveChampionship}>Guardar Resultado Final</Button>
                </div>
              }
            />
          </div>
        </div>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground">
        Hecho por amor al juego.
      </footer>
    </div>
  );
}
