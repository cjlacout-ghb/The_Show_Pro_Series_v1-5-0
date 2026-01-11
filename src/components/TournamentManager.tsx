"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import type { Team, Game, Standing } from "@/lib/types";
import { TrophyIcon } from "@/components/icons";
import TeamSetup from "@/components/team-setup";
import ScheduleCard from "@/components/schedule-card";
import StandingsTable from "@/components/standings-table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
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
    const [championshipGame, setChampionshipGame] = useState<Game>(() => {
        const found = initialGames.find(g => g.isChampionship);
        if (found) {
            return {
                ...found,
                innings: found.innings && found.innings.length > 0
                    ? found.innings
                    : Array(7).fill(0).map(() => ["", ""])
            };
        }
        return {
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
        };
    });

    const [champion, setChampion] = useState<string | null>(null);
    const [standings, setStandings] = useState<Standing[]>([]);
    const [showConfetti, setShowConfetti] = useState(false);
    const [openAccordion, setOpenAccordion] = useState<string | undefined>(undefined);
    const [currentView, setCurrentView] = useState<'menu' | 'teams' | 'games' | 'standings' | 'leaders'>('menu');

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
        setCurrentView('menu');
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

    const handleSwapTeams = (gameId: number) => {
        const swap = (game: Game): Game => ({
            ...game,
            team1Id: game.team2Id,
            team2Id: game.team1Id,
            score1: game.score2,
            score2: game.score1,
            hits1: game.hits2,
            hits2: game.hits1,
            errors1: game.errors2,
            errors2: game.errors1,
            innings: game.innings.map(inn => [inn[1], inn[0]])
        });

        if (championshipGame.id === gameId) {
            setChampionshipGame(prev => {
                const updated = swap(prev);
                markGameForPersistence(gameId);
                return updated;
            });
        } else {
            setPreliminaryGames(prev => {
                const updated = prev.map(g => g.id === gameId ? swap(g) : g);
                markGameForPersistence(gameId);
                setTimeout(() => calculateStandings(updated), 0);
                return updated;
            });
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

        if (finalStandingsWithRank.length > 1) {
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
        if (window.confirm("¿Estás seguro de que quieres reiniciar el torneo? Esto borrará todos los resultados y estadísticas, manteniendo los equipos.")) {
            try {
                // 1. Prevent any further auto-saves
                if (persistTimeoutRef.current) {
                    clearTimeout(persistTimeoutRef.current);
                }
                gamesToPersist.current.clear();

                // 2. Optimistically clear local state to show "zero" immediately
                setPreliminaryGames(prev => prev.map(g => ({
                    ...g,
                    score1: "", score2: "", hits1: "", hits2: "", errors1: "", errors2: "",
                    innings: Array(7).fill(0).map(() => ["", ""])
                })));
                setChampionshipGame(prev => ({
                    ...prev,
                    team1Id: "", team2Id: "",
                    score1: "", score2: "", hits1: "", hits2: "", errors1: "", errors2: "",
                    innings: Array(7).fill(0).map(() => ["", ""])
                }));
                setChampion(null);
                setShowConfetti(false);

                // 3. Call server action
                const result = await resetTournamentScores();

                if (result.success) {
                    toast({ title: "Torneo Reiniciado", description: "La base de datos se ha limpiado correctamente." });
                    // 4. Force a hard reload with a cache-buster to ensure the server component re-fetches
                    window.location.href = '/?t=' + Date.now();
                } else {
                    toast({ variant: "destructive", title: "Error", description: "Hubo un problema al limpiar la base de datos." });
                }
            } catch (error) {
                console.error("Reset error:", error);
                toast({ variant: "destructive", title: "Error", description: "Error inesperado al reiniciar." });
            }
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-background text-foreground">
            {showConfetti && <Confetti recycle={false} numberOfPieces={500} width={confettiSize.width} height={confettiSize.height} style={{ position: 'absolute', top: confettiSize.top, left: confettiSize.left }} />}
            <main ref={mainRef} className="flex-1 container mx-auto p-4 md:p-8">


                {currentView === 'menu' && (
                    <header className="mb-24 flex flex-col md:flex-row items-center justify-start gap-12">
                        <Image src="/images/logo.png" alt="The Show Pro Series Logo" width={240} height={240} className="w-auto h-44 md:h-60" priority />
                        <div className="text-center md:text-left">
                            <h1 className="text-4xl md:text-[5.5rem] font-black tracking-widest text-primary leading-none">THE SHOW PRO SERIES</h1>
                            <h2 className="text-2xl md:text-5xl font-bold mt-2 uppercase">
                                TORNEO INTERNACIONAL<br />DE SOFTBOL MASCULINO
                            </h2>
                            <div className="mt-6 space-y-1">
                                <p className="text-lg md:text-2xl text-muted-foreground font-medium">Paraná, ER - Argentina</p>
                                <p className="text-base md:text-xl text-muted-foreground/80">Marzo, 2026</p>
                            </div>
                        </div>
                    </header>
                )}

                {currentView === 'menu' ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
                            <Button
                                size="lg"
                                className="h-16 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl transition-all hover:scale-105"
                                onClick={() => setCurrentView('teams')}
                            >
                                Equipos y Jugadores
                            </Button>
                            <Button
                                size="lg"
                                className="h-16 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl transition-all hover:scale-105"
                                onClick={() => setCurrentView('games')}
                            >
                                Partidos y Resultados
                            </Button>
                            <Button
                                size="lg"
                                className="h-16 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl transition-all hover:scale-105"
                                onClick={() => setCurrentView('standings')}
                            >
                                Tabla de Posiciones
                            </Button>
                            <Button
                                size="lg"
                                className="h-16 text-lg font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xl transition-all hover:scale-105"
                                onClick={() => setCurrentView('leaders')}
                            >
                                Panel de Líderes
                            </Button>
                        </div>
                        <div className="w-full h-0.5 bg-primary/25 mx-auto mt-24" />
                    </>
                ) : (
                    <div className="space-y-6">
                        <div className="flex justify-start mb-6">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentView('menu')}
                                className="gap-2 border-primary/20 hover:bg-primary/10"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Volver al Menú Principal
                            </Button>
                        </div>

                        {currentView === 'teams' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <TeamSetup teams={teams} openAccordion={openAccordion} setOpenAccordion={setOpenAccordion} onNavigate={handleReturnToTop} />
                            </div>
                        )}

                        {currentView === 'standings' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                {champion && (
                                    <div ref={championCardRef}>
                                        <Card className="bg-card border-primary ring-2 ring-primary shadow-lg animate-in fade-in zoom-in-95">
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
                                <div ref={standingsRef}>
                                    <StandingsTable
                                        teams={teams}
                                        standings={standings}
                                        onNavigate={handleReturnToTop}
                                    />
                                </div>
                            </div>
                        )}

                        {currentView === 'leaders' && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500" ref={statisticsRef}>
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
                                    <CardFooter className="flex justify-end w-full">
                                        <Button size="sm" variant="secondary" onClick={handleReturnToTop}>
                                            Volver al Inicio
                                        </Button>
                                    </CardFooter>
                                </Card>
                            </div>
                        )}

                        {currentView === 'games' && (
                            <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div ref={scheduleRef}>
                                    <ScheduleCard
                                        title="Ronda Inicial"
                                        games={preliminaryGames}
                                        teams={teams}
                                        onGameChange={handleGameChange}
                                        onInningChange={handleInningChange}
                                        onSaveBatting={handleSaveBatting}
                                        onSavePitching={handleSavePitching}
                                        onSwapTeams={handleSwapTeams}
                                        onNavigate={handleReturnToTop}
                                        onNavigateToStandings={() => setCurrentView('standings')}
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
                                    onSwapTeams={handleSwapTeams}
                                    onNavigate={handleReturnToTop}
                                    onNavigateToStandings={() => setCurrentView('standings')}
                                    isChampionship
                                />
                            </div>
                        )}
                    </div>
                )}
            </main>
            {currentView === 'menu' && (
                <footer className="mt-auto py-12 flex flex-col items-center justify-center gap-8 text-center">
                    <div className="flex flex-col items-center gap-6">
                        <Image
                            src="/images/sponsor-logo.png"
                            alt="Developer Branding"
                            width={280}
                            height={70}
                            className="opacity-80 hover:opacity-100 transition-opacity duration-300"
                        />
                        <div className="flex flex-col items-center gap-3">
                            <p className="text-sky-500/50 uppercase tracking-[0.3em] text-[11px] font-bold">
                                desarrollado por C|J|L
                            </p>
                            <button
                                onClick={handleResetTournament}
                                className="text-[10px] text-muted-foreground/40 hover:text-destructive transition-colors underline-offset-4 hover:underline"
                            >
                                Reiniciar Resultados del Torneo
                            </button>
                        </div>
                    </div>
                </footer>
            )}
        </div>
    );
}
