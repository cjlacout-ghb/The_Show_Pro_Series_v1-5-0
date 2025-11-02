
"use client";

import { useState, useCallback, useEffect } from "react";
import type { Team, Game, Standing } from "@/lib/types";
import { TrophyIcon } from "@/components/icons";
import TeamSetup from "@/components/team-setup";
import ScheduleCard from "@/components/schedule-card";
import StandingsTable from "@/components/standings-table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Confetti from "react-confetti";

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
  const [showConfetti, setShowConfetti] = useState(false);

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
    
    let hasTies = false;
    for (const game of preliminaryGames) {
      if (game.score1 !== "" && game.score2 !== "" && game.score1 === game.score2) {
        hasTies = true;
        break;
      }
    }

    if (hasTies) {
      toast({
        variant: "destructive",
        title: "Error de Puntuación",
        description: "No se permiten empates. Por favor, revise los resultados.",
      });
      return;
    }

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

    let rank = 1;
    const finalStandings: Standing[] = newStandings.map((standing, index) => {
      if (index > 0) {
        const prevStanding = newStandings[index - 1];
        if (standing.w !== prevStanding.w || standing.l !== prevStanding.l) {
          rank = index + 1;
        }
      }
      
      const gamesBehind = ((firstPlaceWins - standing.w) + (standing.l - firstPlaceLosses)) / 2;
      return {
        ...standing,
        pos: rank,
        gb: rank === 1 && gamesBehind === 0 ? 0 : gamesBehind,
      };
    });

    setStandings(finalStandings);
    
    if (finalStandings.length > 1 && finalStandings[0].w + finalStandings[0].l > 0) {
      setChampionshipGame(prev => ({
        ...prev,
        team1Id: String(finalStandings[1].teamId), // 2nd place
        team2Id: String(finalStandings[0].teamId)  // 1st place
      }));
    }
    
    toast({
      title: "Posiciones Actualizadas",
      description: "Las posiciones se han recalculado con los últimos resultados.",
    });

  }, [preliminaryGames, teams, toast]);
  
  useEffect(() => {
    // Initial calculation on mount
    const newStandings: Omit<Standing, "pos" | "gb">[] = teams.map(team => ({
      teamId: team.id, w: 0, l: 0, rs: 0, ra: 0, pct: 0,
    }));
    const finalStandings: Standing[] = newStandings.map((standing, index) => ({
      ...standing, pos: index + 1, gb: 0,
    }));
    setStandings(finalStandings);
  }, [teams]);
  
  const handleSaveChampionship = () => {
    const { team1Id, team2Id, score1, score2 } = championshipGame;
    if (score1 !== "" && score2 !== "") {
      const s1 = parseInt(score1);
      const s2 = parseInt(score2);

      if (s1 === s2) {
        toast({
            variant: "destructive",
            title: "Error en el Marcador Final",
            description: "El partido final no puede terminar en empate."
        });
        return;
      }
      
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
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 8000);
          toast({
            title: "¡Campeón Definido!",
            description: `El equipo campeón es ${winner.name}.`
          });
        }
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
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} />}
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <header className="mb-10 text-center">
          <h1 className="text-5xl font-extrabold tracking-widest text-primary">THE SHOW PRO SERIES</h1>
          <h2 className="text-3xl md:text-4xl font-bold mt-4">TORNEO INTERNACIONAL DE SOFTBOL MASCULINO</h2>
          <p className="text-lg md:text-xl text-muted-foreground mt-4">Paraná, ER - Argentina</p>
          <p className="text-md md:text-lg text-muted-foreground">Marzo, 2026</p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          <div className="xl:col-span-2 space-y-8">
            <TeamSetup teams={teams} />
            <StandingsTable
              teams={teams}
              standings={standings}
            />
            {champion && (
              <Card className="bg-card border-primary ring-2 ring-primary shadow-lg animate-in fade-in-50">
                <CardHeader className="items-center text-center">
                  <TrophyIcon className="w-16 h-16 text-primary" />
                  <CardTitle className="text-2xl text-primary">¡Equipo Campeón!</CardTitle>
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
                  <Button onClick={calculateStandings} variant="secondary">Guardar Resultados y Actualizar Posiciones</Button>
                </div>
              }
            />
            <ScheduleCard
              title="Partido Final"
              games={[championshipGame]}
              teams={teams}
              onGameChange={(gameId, field, value) => handleGameChange(gameId, field, value, true)}
              isChampionship
              footer={
                <div className="flex justify-end pt-4">
                  <Button onClick={handleSaveChampionship} variant="secondary">Guardar Resultado Final</Button>
                </div>
              }
            />
          </div>
        </div>
      </main>
      <footer className="py-6 text-center text-sm text-muted-foreground">
        copyright: Cristian Lacout | Hecho por amor al juego
      </footer>
    </div>
  );
}
