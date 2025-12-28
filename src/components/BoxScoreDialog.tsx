"use client";

import { useState } from "react";
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
import { ClipboardList } from "lucide-react";

interface BoxScoreDialogProps {
    game: Game;
    teams: Team[];
    onSaveBatting: (playerId: number, stats: Partial<BattingStat>) => Promise<void>;
    onSavePitching: (playerId: number, stats: Partial<PitchingStat>) => Promise<void>;
}

export default function BoxScoreDialog({ game, teams, onSaveBatting, onSavePitching }: BoxScoreDialogProps) {
    const [activeTab, setActiveTab] = useState("batting");
    const [selectedTeamId, setSelectedTeamId] = useState<string>(game.team1Id);

    const team1 = teams.find(t => String(t.id) === game.team1Id);
    const team2 = teams.find(t => String(t.id) === game.team2Id);
    const currentTeam = teams.find(t => String(t.id) === selectedTeamId);

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

                    <TabsContent value="batting" className="flex-1 overflow-hidden">
                        <ScrollArea className="h-full pr-4">
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
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {currentTeam?.players.map(player => (
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
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="pitching" className="flex-1 overflow-hidden">
                        <ScrollArea className="h-full pr-4">
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
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {currentTeam?.players.map(player => (
                                        <TableRow key={player.id}>
                                            <TableCell className="font-medium">{player.number} - {player.name}</TableCell>
                                            <TableCell><Input className="h-8 text-center" placeholder="0.0" value={getPitchingStat(player.id, "inningsPitched")} onChange={(e) => handlePitchingChange(player.id, "inningsPitched", e.target.value)} /></TableCell>
                                            <TableCell><Input className="h-8 text-center" value={getPitchingStat(player.id, "hits")} onChange={(e) => handlePitchingChange(player.id, "hits", e.target.value)} /></TableCell>
                                            <TableCell><Input className="h-8 text-center" value={getPitchingStat(player.id, "runs")} onChange={(e) => handlePitchingChange(player.id, "runs", e.target.value)} /></TableCell>
                                            <TableCell><Input className="h-8 text-center" value={getPitchingStat(player.id, "earnedRuns")} onChange={(e) => handlePitchingChange(player.id, "earnedRuns", e.target.value)} /></TableCell>
                                            <TableCell><Input className="h-8 text-center" value={getPitchingStat(player.id, "walks")} onChange={(e) => handlePitchingChange(player.id, "walks", e.target.value)} /></TableCell>
                                            <TableCell><Input className="h-8 text-center" value={getPitchingStat(player.id, "strikeOuts")} onChange={(e) => handlePitchingChange(player.id, "strikeOuts", e.target.value)} /></TableCell>
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
        </Dialog>
    );
}
