"use client";

import type { Game, Team } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ScheduleCardProps = {
  title: string;
  games: Game[];
  teams: Team[];
  onGameChange: (gameId: number, field: keyof Game, value: string) => void;
  gameCount: number;
};

export default function ScheduleCard({
  title,
  games,
  teams,
  onGameChange,
}: ScheduleCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Select teams and enter scores for each game.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {games.map((game, index) => (
          <div key={game.id} className="space-y-3">
            <Label className="text-sm font-medium text-muted-foreground">
              Game {index + 1}
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_min-content_2fr_1fr] gap-2 items-center">
              <Select
                value={game.team1Id}
                onValueChange={(value) => onGameChange(game.id, "team1Id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Team 1" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={String(team.id)}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Score"
                value={game.score1}
                onChange={(e) => onGameChange(game.id, "score1", e.target.value)}
              />
              <span className="text-center text-muted-foreground font-semibold">VS</span>
              <Select
                value={game.team2Id}
                onValueChange={(value) => onGameChange(game.id, "team2Id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Team 2" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={String(team.id)}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="number"
                placeholder="Score"
                value={game.score2}
                onChange={(e) => onGameChange(game.id, "score2", e.target.value)}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
