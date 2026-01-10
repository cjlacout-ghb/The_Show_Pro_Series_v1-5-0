"use client";

import { useState, useEffect } from "react";
import type { Game, Team, BattingStat, PitchingStat, Player } from "@/lib/types";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ClipboardList, Trash2, Plus } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface BoxScoreDialogProps {
    game: Game;
    teams: Team[];
    onSaveBatting: (playerId: number, stats: Partial<BattingStat>) => Promise<void>;
    onSavePitching: (playerId: number, stats: Partial<PitchingStat>) => Promise<void>;
}

export default function BoxScoreDialog({ game, teams, onSaveBatting, onSavePitching }: BoxScoreDialogProps) {
    const [activeTab, setActiveTab] = useState("batting");
    const [selectedTeamId, setSelectedTeamId] = useState<string>(game.team1Id);
    const [activeBatters, setActiveBatters] = useState<number[]>([]);
    const [activePitchers, setActivePitchers] = useState<number[]>([]);

    const team1 = teams.find(t => String(t.id) === game.team1Id);
    const team2 = teams.find(t => String(t.id) === game.team2Id);
    const currentTeam = teams.find(t => String(t.id) === selectedTeamId);

    // Initialize active lists based on existing stats
    useEffect(() => {
        if (!currentTeam) return;

        const teamPlayerIds = new Set(currentTeam.players.map(p => p.id));

        // Find batters with existing stats
        const existingBatters = game.battingStats
            ?.filter(s => teamPlayerIds.has(s.playerId))
            .map(s => s.playerId) || [];

        // Find pitchers with existing stats
        const existingPitchers = game.pitchingStats
            ?.filter(s => teamPlayerIds.has(s.playerId))
            .map(s => s.playerId) || [];

        setActiveBatters(prev => Array.from(new Set([...prev, ...existingBatters])));
        setActivePitchers(prev => Array.from(new Set([...prev, ...existingPitchers])));
    }, [selectedTeamId, game.battingStats, game.pitchingStats, currentTeam]);

    // Reset active lists when switching teams (optional, but keeps UI clean)
    useEffect(() => {
        setActiveBatters([]);
        setActivePitchers([]);
    }, [selectedTeamId]);


    const handleBattingChange = (playerId: number, field: keyof BattingStat, value: string) => {
        const numValue = parseInt(value) || 0;
        onSaveBatting(playerId, { [field]: numValue });
    };

    const handlePitchingChange = (playerId: number, field: keyof PitchingStat, value: string) => {
        const numValue = field === "inningsPitched" ? parseFloat(value) || 0 : parseInt(value) || 0;
        onSavePitching(playerId, { [field]: numValue });
    };

    const getBattingStat = (playerId: number, field: keyof BattingStat) => {
        const stat = game.battingStats?.find(s => s.playerId === playerId);
        return stat ? (stat[field] as number).toString() : "";
    };

    const getPitchingStat = (playerId: number, field: keyof PitchingStat) => {
        const stat = game.pitchingStats?.find(s => s.playerId === playerId);
        return stat ? (stat[field] as number).toString() : "";
    };

    const addBatter = (playerIdString: string) => {
        const playerId = parseInt(playerIdString);
        if (!activeBatters.includes(playerId)) {
            setActiveBatters([...activeBatters, playerId]);
        }
    };

    const removeBatter = (playerId: number) => {
        setActiveBatters(activeBatters.filter(id => id !== playerId));
    };

    const addPitcher = (playerIdString: string) => {
        const playerId = parseInt(playerIdString);
        if (!activePitchers.includes(playerId)) {
            setActivePitchers([...activePitchers, playerId]);
        }
    };

    const removePitcher = (playerId: number) => {
        setActivePitchers(activePitchers.filter(id => id !== playerId));
    };

    const availableBatters = currentTeam?.players.filter(p => !activeBatters.includes(p.id)) || [];
    const availablePitchers = currentTeam?.players.filter(p => !activePitchers.includes(p.id)) || [];

    // Sort active players by number for display
    const sortedActiveBatters = currentTeam?.players
        .filter(p => activeBatters.includes(p.id))
        .sort((a, b) => activeBatters.indexOf(a.id) - activeBatters.indexOf(b.id)); // Keep insertion order? Or sort by roster number?
    // Let's stick to insertion order for lineup feeling, or roster number. 
    // User requested "add players one by one, according to the lineup".
    // Insertion order is best for "lineup".

    const displayBatters = activeBatters.map(id => currentTeam?.players.find(p => p.id === id)).filter(Boolean) as Player[];
    const displayPitchers = activePitchers.map(id => currentTeam?.players.find(p => p.id === id)).filter(Boolean) as Player[];


    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <ClipboardList className="w-4 h-4" />
                    Box Score
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Estadísticas del Juego: {team1?.name} vs {team2?.name}</DialogTitle>
                </DialogHeader>

                <div className="flex gap-4 mb-4">
                    <Button
                        variant={selectedTeamId === String(team1?.id) ? "default" : "outline"}
                        onClick={() => setSelectedTeamId(String(team1?.id))}
                        className="flex-1"
                    >
                        {team1?.name}
                    </Button>
                    <Button
                        variant={selectedTeamId === String(team2?.id) ? "default" : "outline"}
                        onClick={() => setSelectedTeamId(String(team2?.id))}
                        className="flex-1"
                    >
                        {team2?.name}
                    </Button>
                </div>

                <Tabs defaultValue="batting" onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="batting">Bateo</TabsTrigger>
                        <TabsTrigger value="pitching">Pitcheo</TabsTrigger>
                    </TabsList>

                    <TabsContent value="batting" className="flex-1 overflow-hidden flex flex-col gap-4">
                        <div className="flex items-center gap-2 mt-2 px-1">
                            <Select onValueChange={addBatter}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Agregar bateador..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availableBatters.map((player) => (
                                        <SelectItem key={player.id} value={String(player.id)}>
                                            {player.number} - {player.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <ScrollArea className="flex-1 pr-4 border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[200px]">Jugador</TableHead>
                                        <TableHead className="text-center">PA</TableHead>
                                        <TableHead className="text-center">AB</TableHead>
                                        <TableHead className="text-center">H</TableHead>
                                        <TableHead className="text-center">R</TableHead>
                                        <TableHead className="text-center">RBI</TableHead>
                                        <TableHead className="text-center">HR</TableHead>
                                        <TableHead className="text-center">BB</TableHead>
                                        <TableHead className="text-center">K</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {displayBatters.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={10} className="text-center text-muted-foreground h-24">
                                                No hay bateadores activos. Agregue jugadores arriba.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {displayBatters.map(player => (
                                        <TableRow key={player.id}>
                                            <TableCell className="font-medium">{player.number} - {player.name}</TableCell>
                                            <TableCell><Input className="h-8 text-center" value={getBattingStat(player.id, "plateAppearances")} onChange={(e) => handleBattingChange(player.id, "plateAppearances", e.target.value)} /></TableCell>
                                            <TableCell><Input className="h-8 text-center" value={getBattingStat(player.id, "atBats")} onChange={(e) => handleBattingChange(player.id, "atBats", e.target.value)} /></TableCell>
                                            <TableCell><Input className="h-8 text-center" value={getBattingStat(player.id, "hits")} onChange={(e) => handleBattingChange(player.id, "hits", e.target.value)} /></TableCell>
                                            <TableCell><Input className="h-8 text-center" value={getBattingStat(player.id, "runs")} onChange={(e) => handleBattingChange(player.id, "runs", e.target.value)} /></TableCell>
                                            <TableCell><Input className="h-8 text-center" value={getBattingStat(player.id, "rbi")} onChange={(e) => handleBattingChange(player.id, "rbi", e.target.value)} /></TableCell>
                                            <TableCell><Input className="h-8 text-center" value={getBattingStat(player.id, "homeRuns")} onChange={(e) => handleBattingChange(player.id, "homeRuns", e.target.value)} /></TableCell>
                                            <TableCell><Input className="h-8 text-center" value={getBattingStat(player.id, "walks")} onChange={(e) => handleBattingChange(player.id, "walks", e.target.value)} /></TableCell>
                                            <TableCell><Input className="h-8 text-center" value={getBattingStat(player.id, "strikeOuts")} onChange={(e) => handleBattingChange(player.id, "strikeOuts", e.target.value)} /></TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/90" onClick={() => removeBatter(player.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="pitching" className="flex-1 overflow-hidden flex flex-col gap-4">
                        <div className="flex items-center gap-2 mt-2 px-1">
                            <Select onValueChange={addPitcher}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Agregar lanzador..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {availablePitchers.map((player) => (
                                        <SelectItem key={player.id} value={String(player.id)}>
                                            {player.number} - {player.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <ScrollArea className="flex-1 pr-4 border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[200px]">Lanzador</TableHead>
                                        <TableHead className="text-center">IP</TableHead>
                                        <TableHead className="text-center">H</TableHead>
                                        <TableHead className="text-center">R</TableHead>
                                        <TableHead className="text-center">ER</TableHead>
                                        <TableHead className="text-center">BB</TableHead>
                                        <TableHead className="text-center">K</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {displayPitchers.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={8} className="text-center text-muted-foreground h-24">
                                                No hay lanzadores activos. Agregue jugadores arriba.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {displayPitchers.map(player => (
                                        <TableRow key={player.id}>
                                            <TableCell className="font-medium">{player.number} - {player.name}</TableCell>
                                            <TableCell><Input className="h-8 text-center" placeholder="0.0" value={getPitchingStat(player.id, "inningsPitched")} onChange={(e) => handlePitchingChange(player.id, "inningsPitched", e.target.value)} /></TableCell>
                                            <TableCell><Input className="h-8 text-center" value={getPitchingStat(player.id, "hits")} onChange={(e) => handlePitchingChange(player.id, "hits", e.target.value)} /></TableCell>
                                            <TableCell><Input className="h-8 text-center" value={getPitchingStat(player.id, "runs")} onChange={(e) => handlePitchingChange(player.id, "runs", e.target.value)} /></TableCell>
                                            <TableCell><Input className="h-8 text-center" value={getPitchingStat(player.id, "earnedRuns")} onChange={(e) => handlePitchingChange(player.id, "earnedRuns", e.target.value)} /></TableCell>
                                            <TableCell><Input className="h-8 text-center" value={getPitchingStat(player.id, "walks")} onChange={(e) => handlePitchingChange(player.id, "walks", e.target.value)} /></TableCell>
                                            <TableCell><Input className="h-8 text-center" value={getPitchingStat(player.id, "strikeOuts")} onChange={(e) => handlePitchingChange(player.id, "strikeOuts", e.target.value)} /></TableCell>
                                            <TableCell>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/90" onClick={() => removePitcher(player.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>

                <DialogFooter className="mt-4">
                    <p className="text-xs text-muted-foreground mr-auto">* Los cambios se guardan automáticamente al escribir.</p>
                </DialogFooter>
            </DialogContent>
        </Dialog >
    );
}

