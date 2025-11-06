
"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Team, Game, Standing } from "@/lib/types";
import { TrophyIcon } from "@/components/icons";
import TeamSetup from "@/components/team-setup";
import ScheduleCard from "@/components/schedule-card";
import StandingsTable from "@/components/standings-table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Confetti from "react-confetti";
import Image from "next/image";

const initialTeams: Team[] = [
  { id: 1, name: "ACCIN VORTEX (ARG)" },
  { id: 2, name: "CACIQUES BY SWING (CHI)" },
  { id: 3, name: "CITY PAN (CHI)" },
  { id: 4, name: "MAYO'S (MEX)" },
  { id: 5, name: "SOUTH ARGENTINA (ARG)" },
  { id: 6, name: "TEAM FINCA JUJURE (VEN)" },
];

const createInitialGames = (): Game[] => {
    const gameData = [
        { id: 1, team1Id: "2", team2Id: "4", day: "DÍA 1: Miércoles, 18 de marzo", time: "10:15" },
        { id: 2, team1Id: "1", team2Id: "6", day: "DÍA 1: Miércoles, 18 de marzo", time: "13:15" },
        { id: 3, team1Id: "3", team2Id: "5", day: "DÍA 1: Miércoles, 18 de marzo", time: "16:15" },
        { id: 4, team1Id: "1", team2Id: "5", day: "DÍA 1: Miércoles, 18 de marzo", time: "21:00" },
        { id: 5, team1Id: "3", team2Id: "6", day: "DÍA 2: Jueves, 19 de marzo", time: "10:15" },
        { id: 6, team1Id: "2", team2Id: "5", day: "DÍA 2: Jueves, 19 de marzo", time: "13:15" },
        { id: 7, team1Id: "4", team2Id: "1", day: "DÍA 2: Jueves, 19 de marzo", time: "16:15" },
        { id: 8, team1Id: "3", team2Id: "2", day: "DÍA 2: Jueves, 19 de marzo", time: "21:00" },
        { id: 9, team1Id: "5", team2Id: "6", day: "DÍA 3: Viernes, 20 de marzo", time: "10:15" },
        { id: 10, team1Id: "4", team2Id: "3", day: "DÍA 3: Viernes, 20 de marzo", time: "13:15" },
        { id: 11, team1Id: "2", team2Id: "1", day: "DÍA 3: Viernes, 20 de marzo", time: "16:15" },
        { id: 12, team1Id: "6", team2Id: "4", day: "DÍA 3: Viernes, 20 de marzo", time: "21:00" },
        { id: 13, team1Id: "1", team2Id: "3", day: "DÍA 4: Sábado, 21 de marzo", time: "12:00" },
        { id: 14, team1Id: "6", team2Id: "2", day: "DÍA 4: Sábado, 21 de marzo", time: "15:00" },
        { id: 15, team1Id: "5", team2Id: "4", day: "DÍA 4: Sábado, 21 de marzo", time: "18:00" },
    ];

    return gameData.map(game => {
        if (game.id === 1) {
            return {
                ...game,
                score1: "8",
                score2: "9",
                hits1: "8",
                errors1: "3",
                hits2: "10",
                errors2: "3",
                innings: [
                    ["1", "2"],
                    ["1", "0"],
                    ["1", "1"],
                    ["1", "1"],
                    ["1", "1"],
                    ["1", "1"],
                    ["1", "1"],
                    ["1", "2"],
                ],
            };
        }
        return {
            ...game,
            score1: "",
            score2: "",
            hits1: "",
            errors1: "",
            hits2: "",
            errors2: "",
            innings: Array(7).fill(0).map(() => ["", ""]),
        };
    });
};

const initialChampionshipGame: Game = {
  id: 16,
  team1Id: "",
  score1: "",
  hits1: "",
  errors1: "",
  team2Id: "",
  score2: "",
  hits2: "",
  errors2: "",
  day: "DÍA 4: Sábado, 21 de marzo",
  time: "21:00",
  innings: Array(7).fill(0).map(() => ["", ""]),
};

export default function Home() {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [preliminaryGames, setPreliminaryGames] = useState<Game[]>(createInitialGames());
  const [championshipGame, setChampionshipGame] = useState<Game>(initialChampionshipGame);
  const [champion, setChampion] = useState<string | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  const championCardRef = useRef<HTMLDivElement>(null);
  const standingsRef = useRef<HTMLDivElement>(null);
  const [confettiSize, setConfettiSize] = useState({ width: 0, height: 0, top: 0, left: 0 });

  const { toast } = useToast();

  const handleGoToStandings = () => {
    standingsRef.current?.scrollIntoView({ behavior: 'smooth' });
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

  const handleInningChange = (
    gameId: number,
    inningIndex: number,
    teamIndex: 0 | 1,
    value: string,
    isChampionship = false
  ) => {
    const updater = isChampionship ? setChampionshipGame : setPreliminaryGames;
    updater((prevState: any) => {
        const updateInnings = (game: Game) => {
            const newInnings = game.innings.map(inning => [...inning]);
            const normalizedValue = value.toUpperCase() === 'X' ? 'X' : value;
            
            if (inningIndex >= newInnings.length) {
                newInnings.push(["", ""]);
            }
            newInnings[inningIndex][teamIndex] = normalizedValue;
            
            if(inningIndex === newInnings.length - 1 && value !== "") {
              const score1 = newInnings.reduce((sum, inning) => sum + (parseInt(String(inning[0])) || 0), 0);
              const score2 = newInnings.reduce((sum, inning) => sum + (parseInt(String(inning[1])) || 0), 0);
              if (inningIndex >= 6 && score1 === score2) {
                newInnings.push(["", ""]);
              }
            }

            const score1 = newInnings.reduce((sum, inning) => sum + (inning[0] !== 'X' ? (parseInt(String(inning[0])) || 0) : 0), 0);
            const score2 = newInnings.reduce((sum, inning) => sum + (inning[1] !== 'X' ? (parseInt(String(inning[1])) || 0) : 0), 0);
            
            const updatedGame = { ...game, innings: newInnings, score1: String(score1), score2: String(score2) };

            if (isChampionship) {
              handleSaveChampionship(updatedGame);
            } else {
              calculateStandings(preliminaryGames.map(g => g.id === gameId ? updatedGame : g));
            }
            
            return updatedGame;
        };
        
        if (isChampionship) {
            return updateInnings(prevState);
        }
        return prevState.map((game: Game) =>
            game.id === gameId ? updateInnings(game) : game
        );
    });
  };

  const calculateStandings = useCallback((gamesToProcess: Game[]) => {
    const newStandings: Omit<Standing, "pos" | "gb">[] = teams.map(team => ({
      teamId: team.id,
      w: 0,
      l: 0,
      rs: 0,
      ra: 0,
      pct: 0,
    }));
    
    let hasTies = false;
    for (const game of gamesToProcess) {
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

    gamesToProcess.forEach(game => {
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

    newStandings.sort((a, b) => b.w - a.w);

    const groupedByWins: { [key: number]: (typeof newStandings) } = {};
    newStandings.forEach(s => {
      if (!groupedByWins[s.w]) {
        groupedByWins[s.w] = [];
      }
      groupedByWins[s.w].push(s);
    });

    const sortedStandings: (typeof newStandings) = [];
    Object.values(groupedByWins).reverse().forEach(group => {
      if (group.length <= 1) {
        sortedStandings.push(...group);
        return;
      }

      group.sort((a, b) => {
        const tiedTeamIds = group.map(s => s.teamId);
        let winsA = 0;
        let winsB = 0;
        gamesToProcess.forEach(game => {
          const gameTeamIds = [parseInt(game.team1Id), parseInt(game.team2Id)];
          if (tiedTeamIds.includes(gameTeamIds[0]) && tiedTeamIds.includes(gameTeamIds[1])) {
            if(game.team1Id === String(a.teamId) && game.team2Id === String(b.teamId)) {
                if(parseInt(game.score1) > parseInt(game.score2)) winsA++;
                if(parseInt(game.score2) > parseInt(game.score1)) winsB++;
            } else if (game.team1Id === String(b.teamId) && game.team2Id === String(a.teamId)) {
                if(parseInt(game.score1) > parseInt(game.score2)) winsB++;
                if(parseInt(game.score2) > parseInt(game.score1)) winsA++;
            }
          }
        });

        if (winsA !== winsB) {
          return winsB - winsA;
        }

        let rs_a = 0, ra_a = 0, innings_def_a = 0;
        let rs_b = 0, ra_b = 0, innings_def_b = 0;

        gamesToProcess.forEach(game => {
          const isRelevant = tiedTeamIds.includes(parseInt(game.team1Id)) && tiedTeamIds.includes(parseInt(game.team2Id));
          if (!isRelevant) return;

          const inningsPlayedTeam1 = game.innings.filter(inn => inn[0] !== '' && inn[0] !== 'X').length;
          const inningsPlayedTeam2 = game.innings.filter(inn => inn[1] !== '' && inn[1] !== 'X').length;


          if (game.team1Id === String(a.teamId)) {
            rs_a += parseInt(game.score1);
            ra_a += parseInt(game.score2);
            innings_def_a += inningsPlayedTeam2;
          } else if (game.team2Id === String(a.teamId)) {
            rs_a += parseInt(game.score2);
            ra_a += parseInt(game.score1);
            innings_def_a += inningsPlayedTeam1;
          }

          if (game.team1Id === String(b.teamId)) {
            rs_b += parseInt(game.score1);
            ra_b += parseInt(game.score2);
            innings_def_b += inningsPlayedTeam2;
          } else if (game.team2Id === String(b.teamId)) {
            rs_b += parseInt(game.score2);
            ra_b += parseInt(game.score1);
            innings_def_b += inningsPlayedTeam1;
          }
        });

        const tqbA = (innings_def_a > 0) ? (rs_a / innings_def_a) - (ra_a / innings_def_a) : 0;
        const tqbB = (innings_def_b > 0) ? (rs_b / innings_def_b) - (ra_b / innings_def_b) : 0;

        if (tqbA !== tqbB) {
            return tqbB - tqbA;
        }

        return 0;
      });

      sortedStandings.push(...group);
    });

    const firstPlaceWins = sortedStandings.length > 0 ? sortedStandings[0].w : 0;
    const firstPlaceLosses = sortedStandings.length > 0 ? sortedStandings[0].l : 0;

    let rank = 1;
    const finalStandings: Standing[] = sortedStandings.map((standing, index) => {
      if (index > 0) {
        const prevStanding = sortedStandings[index - 1];
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
    
    if (finalStandings.length > 1 && finalStandings.every(s => s.w + s.l > 0)) {
      setChampionshipGame(prev => ({
        ...prev,
        team1Id: String(finalStandings[1].teamId),
        team2Id: String(finalStandings[0].teamId)
      }));
    }

  }, [teams, toast]);
  
  useEffect(() => {
    calculateStandings(preliminaryGames);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teams]);
  
  const handleSaveChampionship = (finalGame: Game) => {
    const { team1Id, team2Id, score1, score2 } = finalGame;
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
          setTimeout(() => {
            if (championCardRef.current) {
              championCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
              const { width, height, top, left } = championCardRef.current.getBoundingClientRect();
              setConfettiSize({ width, height, top: top + window.scrollY, left: left + window.scrollX });
            }
          }, 100);
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
      {showConfetti && <Confetti recycle={false} numberOfPieces={500} width={confettiSize.width} height={confettiSize.height} style={{ position: 'absolute', top: confettiSize.top, left: confettiSize.left }} />}
      <main className="flex-1 container mx-auto p-4 md:p-8">
        <header className="mb-10 flex items-center justify-start gap-8">
          <Image src="/images/logo.png" alt="The Show Pro Series Logo" width={90} height={90} />
          <div className="text-left">
            <h1 className="text-4xl md:text-5xl font-black tracking-widest text-primary">THE SHOW PRO SERIES</h1>
            <h2 className="text-2xl md:text-4xl font-bold mt-2">TORNEO INTERNACIONAL DE SOFTBOL MASCULINO</h2>
            <p className="text-md md:text-xl text-muted-foreground mt-2">Paraná, ER - Argentina</p>
            <p className="text-sm md:text-lg text-muted-foreground">Marzo, 2026</p>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          <div className="xl:col-span-2 space-y-8">
            <TeamSetup teams={teams} />
            <div ref={standingsRef}>
              <StandingsTable
                teams={teams}
                standings={standings}
              />
            </div>
            {champion && (
              <div ref={championCardRef}>
                <Card className="bg-card border-primary ring-2 ring-primary shadow-lg animate-in fade-in-50">
                  <CardHeader className="items-center text-center">
                    <TrophyIcon className="w-16 h-16 text-primary" />
                    <CardTitle className="text-2xl text-primary">¡Equipo Campeón!</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-3xl font-bold tracking-wider text-foreground">{champion}</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
          <div className="xl:col-span-3 space-y-8">
            <ScheduleCard
              title="Ronda Inicial"
              games={preliminaryGames}
              teams={teams}
              onGameChange={(gameId, field, value) => handleGameChange(gameId, field, value, false)}
              onInningChange={(gameId, inningIndex, teamIndex, value) => handleInningChange(gameId, inningIndex, teamIndex, value, false)}
              onNavigate={handleGoToStandings}
            />
            <ScheduleCard
              title="Partido Final"
              games={[championshipGame]}
              teams={teams}
              onGameChange={(gameId, field, value) => handleGameChange(gameId, field, value, true)}
              onInningChange={(gameId, inningIndex, teamIndex, value) => handleInningChange(gameId, inningIndex, teamIndex, value, true)}
              isChampionship
            />
          </div>
        </div>
      </main>
      <footer className="py-6 flex flex-col items-center justify-center gap-4 text-center text-sm text-muted-foreground">
        <Image src="/images/sponsor-logo.png" alt="Sponsor Logo" width={200} height={100} />
        <p>copyright: Cristian Lacout | Hecho por amor al juego</p>
      </footer>
    </div>
  );
}

    