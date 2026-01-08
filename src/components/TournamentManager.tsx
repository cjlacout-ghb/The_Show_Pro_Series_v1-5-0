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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Confetti from "react-confetti";
import Image from "next/image";
import { updateGame, saveBattingStat, savePitchingStat, resetTournamentScores } from "@/app/actions";
import type { BattingStat, PitchingStat } from "@/lib/types";
import LeaderBoard from "./LeaderBoard";

interface TournamentManagerProps {
    initialTeams: Team[];
    initialGames: Game[];
    initialBattingStats: any[];
    initialPitchingStats: any[];
}

export default function TournamentManager({ initialTeams, initialGames, initialBattingStats, initialPitchingStats }: TournamentManagerProps) {
    const [teams, setTeams] = useState<Team[]>(initialTeams);
    const [preliminaryGames, setPreliminaryGames] = useState<Game[]>(
        initialGames
            .filter(g => !g.isChampionship)
            .map(g => ({
                ...g,
                innings: g.innings && g.innings.length > 0
                    ? g.innings
                    : Array(7).fill(0).map(() => ["", ""])
            }))
    );
    const [championshipGame, setChampionshipGame] = useState<Game>(
        initialGames.find(g => g.isChampionship) || {
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
            isChampionship: true
        }
    );

    const [champion, setChampion] = useState<string | null>(null);
    const [standings, setStandings] = useState<Standing[]>([]);
    const [showConfetti, setShowConfetti] = useState(false);
    const [openAccordion, setOpenAccordion] = useState<string | undefined>(undefined);

    const mainRef = useRef<HTMLDivElement>(null);
    const teamRosterRef = useRef<HTMLDivElement>(null);
    const scheduleRef = useRef<HTMLDivElement>(null);
    const standingsRef = useRef<HTMLDivElement>(null);
    const statisticsRef = useRef<HTMLDivElement>(null);
    const championCardRef = useRef<HTMLDivElement>(null);

    const [confettiSize, setConfettiSize] = useState({ width: 0, height: 0, top: 0, left: 0 });

    // Track games that need to be persisted
    const gamesToPersist = useRef<Set<number>>(new Set());
    const persistTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const { toast } = useToast();

    const handleScrollTo = (ref: React.RefObject<HTMLDivElement>) => {
        setOpenAccordion(undefined);
        ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const handleReturnToTop = () => {
        setOpenAccordion(undefined);
        handleScrollTo(mainRef);
    };

    // Debounced persist function that runs outside of render
    useEffect(() => {
        if (gamesToPersist.current.size === 0) return;

        // Clear existing timeout
        if (persistTimeoutRef.current) {
            clearTimeout(persistTimeoutRef.current);
        }

        // Debounce persistence to avoid too many DB calls
        persistTimeoutRef.current = setTimeout(async () => {
            const gameIds = Array.from(gamesToPersist.current);
            gamesToPersist.current.clear();

            for (const gameId of gameIds) {
                try {
                    // Find the game in either preliminary or championship
                    let gameToSave: Game | undefined;

                    if (championshipGame.id === gameId) {
                        gameToSave = championshipGame;
                    } else {
                        gameToSave = preliminaryGames.find(g => g.id === gameId);
                    }

                    if (gameToSave) {
                        await updateGame(gameToSave.id, gameToSave);
                    }
                } catch (error) {
                    console.error(`Failed to save game ${gameId}`, error);
                    toast({
                        variant: "destructive",
                        title: "Error de Guardado",
                        description: "No se pudieron guardar los cambios en la base de datos.",
                    });
                }
            }
        }, 500); // 500ms debounce

        return () => {
            if (persistTimeoutRef.current) {
                clearTimeout(persistTimeoutRef.current);
            }
        };
    }, [preliminaryGames, championshipGame, toast]);

    const markGameForPersistence = (gameId: number) => {
        gamesToPersist.current.add(gameId);
    };

    const handleGameChange = (
        gameId: number,
        field: keyof Game,
        value: string,
        isChampionship = false
    ) => {
        if (isChampionship) {
            setChampionshipGame(prev => {
                const updatedGame = { ...prev, [field]: value };
                if (field === 'score1' || field === 'score2') {
                    handleSaveChampionship(updatedGame);
                }
                markGameForPersistence(gameId);
                return updatedGame;
            });
        } else {
            setPreliminaryGames(prevGames => {
                const newGames = prevGames.map(game =>
                    game.id === gameId ? { ...game, [field]: value } : game
                );

                if (field === 'score1' || field === 'score2') {
                    // Schedule standings recalculation
                    setTimeout(() => calculateStandings(newGames), 0);
                }

                markGameForPersistence(gameId);
                return newGames;
            });
        }
    };

    const handleInningChange = (
        gameId: number,
        inningIndex: number,
        teamIndex: 0 | 1,
        value: string,
        isChampionship = false
    ) => {
        const updateInnings = (game: Game): Game => {
            const newInnings = game.innings.map((inning: any) => [...inning]);
            const normalizedValue = value.toUpperCase() === 'X' ? 'X' : value;

            if (inningIndex >= newInnings.length) {
                newInnings.push(["", ""]);
            }
            newInnings[inningIndex][teamIndex] = normalizedValue;

            if (inningIndex === newInnings.length - 1 && value !== "") {
                const score1 = newInnings.reduce((sum: number, inning: any) => sum + (parseInt(String(inning[0])) || 0), 0);
                const score2 = newInnings.reduce((sum: number, inning: any) => sum + (parseInt(String(inning[1])) || 0), 0);
                if (inningIndex >= 6 && score1 === score2) {
                    newInnings.push(["", ""]);
                }
            }

            const score1 = newInnings.reduce((sum: number, inning: any) => sum + (inning[0] !== 'X' ? (parseInt(String(inning[0])) || 0) : 0), 0);
            const score2 = newInnings.reduce((sum: number, inning: any) => sum + (inning[1] !== 'X' ? (parseInt(String(inning[1])) || 0) : 0), 0);

            return { ...game, innings: newInnings, score1: String(score1), score2: String(score2) };
        };

        if (isChampionship) {
            setChampionshipGame(prev => {
                const updatedGame = updateInnings(prev);
                handleSaveChampionship(updatedGame);
                markGameForPersistence(gameId);
                return updatedGame;
            });
        } else {
            setPreliminaryGames(prevGames => {
                const newGames = prevGames.map(game =>
                    game.id === gameId ? updateInnings(game) : game
                );

                // Schedule standings recalculation
                setTimeout(() => calculateStandings(newGames), 0);

                markGameForPersistence(gameId);
                return newGames;
            });
        }
    };

    const handleSaveBatting = async (gameId: number, playerId: number, stats: Partial<BattingStat>) => {
        try {
            await saveBattingStat({ gameId, playerId, stats });

            // Update local state to show changes immediately
            const updateGameStats = (game: Game): Game => {
                const existingStats = game.battingStats || [];
                const index = existingStats.findIndex(s => s.playerId === playerId);
                const newBattingStats = [...existingStats];
                if (index > -1) {
                    newBattingStats[index] = { ...newBattingStats[index], ...stats };
                } else {
                    newBattingStats.push({ gameId, playerId, ...stats } as BattingStat);
                }
                return { ...game, battingStats: newBattingStats };
            };

            if (championshipGame.id === gameId) {
                setChampionshipGame(prev => updateGameStats(prev));
            } else {
                setPreliminaryGames(prev => prev.map(g => g.id === gameId ? updateGameStats(g) : g));
            }
        } catch (error) {
            console.error("Failed to save batting stats", error);
        }
    };

    const handleSavePitching = async (gameId: number, playerId: number, stats: Partial<PitchingStat>) => {
        try {
            await savePitchingStat({ gameId, playerId, stats });

            // Update local state
            const updateGameStats = (game: Game): Game => {
                const existingStats = game.pitchingStats || [];
                const index = existingStats.findIndex(s => s.playerId === playerId);
                const newPitchingStats = [...existingStats];
                if (index > -1) {
                    newPitchingStats[index] = { ...newPitchingStats[index], ...stats };
                } else {
                    newPitchingStats.push({ gameId, playerId, ...stats } as PitchingStat);
                }
                return { ...game, pitchingStats: newPitchingStats };
            };

            if (championshipGame.id === gameId) {
                setChampionshipGame(prev => updateGameStats(prev));
            } else {
                setPreliminaryGames(prev => prev.map(g => g.id === gameId ? updateGameStats(g) : g));
            }
        } catch (error) {
            console.error("Failed to save pitching stats", error);
        }
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
            standing.pct = gamesPlayed > 0 ? standing.w / gamesPlayed : 0;
        });

        newStandings.sort((a, b) => {
            if (b.pct !== a.pct) {
                return b.pct - a.pct;
            }

            const diffA = a.rs - a.ra;
            const diffB = b.rs - b.ra;
            if (diffB !== diffA) {
                return diffB - diffA;
            }

            const gamesA = a.w + a.l;
            const gamesB = b.w + b.l;
            if (gamesA !== gamesB) {
                return gamesA - gamesB;
            }

            return 0;
        });

        let rank = 1;
        const finalStandingsWithRank: Standing[] = newStandings.map((standing, index) => {
            if (index > 0) {
                const prevStanding = newStandings[index - 1];
                if (standing.w !== prevStanding.w || standing.l !== prevStanding.l) {
                    rank = index + 1;
                }
            }

            const firstPlaceWins = newStandings.length > 0 ? newStandings[0].w : 0;
            const firstPlaceLosses = newStandings.length > 0 ? newStandings[0].l : 0;
            const gamesBehind = ((firstPlaceWins - standing.w) + (standing.l - firstPlaceLosses)) / 2;
            const gamesPlayed = standing.w + standing.l;
            const displayPct = gamesPlayed > 0 ? Math.round((standing.w / gamesPlayed) * 1000) : 0;

            return {
                ...standing,
                pos: rank,
                gb: gamesPlayed === 0 ? 0 : gamesBehind,
                pct: displayPct,
            };
        });

        setStandings(finalStandingsWithRank);

        if (finalStandingsWithRank.length > 1 && finalStandingsWithRank.every(s => s.w + s.l === 5)) {
            setChampionshipGame(prev => {
                const newChampGame = {
                    ...prev,
                    team1Id: String(finalStandingsWithRank[1].teamId),
                    team2Id: String(finalStandingsWithRank[0].teamId)
                };
                markGameForPersistence(newChampGame.id);
                return newChampGame;
            });
        }

    }, [teams]);

    useEffect(() => {
        calculateStandings(preliminaryGames);
    }, [teams, preliminaryGames, calculateStandings]);

    const handleSaveChampionship = (finalGame: Game) => {
        const { team1Id, team2Id, score1, score2 } = finalGame;
        if (score1 !== "" && score2 !== "") {
            const s1 = parseInt(score1);
            const s2 = parseInt(score2);

            if (s1 === s2) {
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
        }
    }

    const handleResetTournament = async () => {
        if (window.confirm("¿Estás seguro de que quieres reiniciar todos los resultados? Esto borrará todos los scores y estadísticas, pero mantendrá los rosters de los equipos.")) {
            try {
                const result = await resetTournamentScores();
                if (result.success) {
                    toast({ title: "Torneo Reiniciado", description: "Todos los resultados han sido borrados." });
                    window.location.reload();
                } else {
                    toast({ variant: "destructive", title: "Error", description: "No se pudo reiniciar el torneo." });
                }
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "Ocurrió un error inesperado." });
            }
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            {showConfetti && <Confetti recycle={false} numberOfPieces={500} width={confettiSize.width} height={confettiSize.height} style={{ position: 'absolute', top: confettiSize.top, left: confettiSize.left }} />}
            <main ref={mainRef} className="flex-1 container mx-auto p-4 md:p-8">
                <header className="mb-10 flex items-center justify-start gap-8">
                    <Image src="/images/logo.png" alt="The Show Pro Series Logo" width={180} height={180} />
                    <div className="text-left">
                        <h1 className="text-4xl md:text-5xl font-black tracking-widest text-primary">THE SHOW PRO SERIES</h1>
                        <h2 className="text-2xl md:text-4xl font-bold mt-2">
                            TORNEO INTERNACIONAL<br />DE SOFTBOL MASCULINO
                        </h2>
                        <p className="text-md md:text-xl text-muted-foreground mt-2">Paraná, ER - Argentina</p>
                        <p className="text-sm md:text-lg text-muted-foreground">Marzo, 2026</p>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
                    <Button size="lg" variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground justify-center" onClick={() => handleScrollTo(teamRosterRef)}>
                        Equipos y Jugadores
                    </Button>
                    <Button size="lg" variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground justify-center" onClick={() => handleScrollTo(scheduleRef)}>
                        Partidos y Resultados
                    </Button>
                    <Button size="lg" variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground justify-center" onClick={() => handleScrollTo(standingsRef)}>
                        Tabla de Posiciones
                    </Button>
                    <Button size="lg" variant="default" className="bg-primary hover:bg-primary/90 text-primary-foreground justify-center" onClick={() => handleScrollTo(statisticsRef)}>
                        Panel de Líderes
                    </Button>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
                    <div className="xl:col-span-2 space-y-8">
                        <div ref={teamRosterRef}>
                            <TeamSetup teams={teams} openAccordion={openAccordion} setOpenAccordion={setOpenAccordion} onNavigate={handleReturnToTop} />
                        </div>
                        <div ref={standingsRef}>
                            <StandingsTable
                                teams={teams}
                                standings={standings}
                                onNavigate={handleReturnToTop}
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
                        <div ref={statisticsRef}>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Panel de Líderes</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <LeaderBoard
                                        games={[...preliminaryGames, championshipGame]}
                                        teams={teams}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                    <div className="xl:col-span-3 space-y-8">
                        <div ref={scheduleRef}>
                            <ScheduleCard
                                title="Ronda Inicial"
                                games={preliminaryGames}
                                teams={teams}
                                onGameChange={handleGameChange}
                                onInningChange={handleInningChange}
                                onSaveBatting={handleSaveBatting}
                                onSavePitching={handleSavePitching}
                                onNavigate={handleReturnToTop}
                                onNavigateToStandings={() => handleScrollTo(standingsRef)}
                            />
                        </div>
                        <ScheduleCard
                            title="Partido Final"
                            games={[championshipGame]}
                            teams={teams}
                            onGameChange={(gameId, field, value) => handleGameChange(gameId, field, value, true)}
                            onInningChange={(gameId, inningIndex, teamIndex, value) => handleInningChange(gameId, inningIndex, teamIndex, value, true)}
                            onSaveBatting={handleSaveBatting}
                            onSavePitching={handleSavePitching}
                            isChampionship
                        />
                    </div>
                </div>
            </main>
            <footer className="py-6 flex flex-col items-center justify-center gap-4 text-center text-sm text-muted-foreground">
                <Image src="/images/sponsor-logo.png" alt="Sponsor Logo" width={200} height={100} />
                <div className="flex flex-col items-center gap-2">
                    <p>copyright: Cristian Lacout | Hecho por amor al juego</p>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] text-muted-foreground/30 hover:text-destructive transition-colors"
                        onClick={handleResetTournament}
                    >
                        Reiniciar Resultados del Torneo
                    </Button>
                </div>
            </footer>
        </div>
    );
}
