
"use client";

import type { Game, Team } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Fragment } from "react";

type ScheduleCardProps = {
  title: string;
  games: Game[];
  teams: Team[];
  onGameChange: (gameId: number, field: keyof Game, value: string) => void;
  footer?: React.ReactNode;
};

export default function ScheduleCard({
  title,
  games,
  teams,
  onGameChange,
  footer,
}: ScheduleCardProps) {
  const getTeamName = (teamId: string) => {
    return teams.find((t) => String(t.id) === teamId)?.name || "Seleccionar Equipo";
  };
  
  let lastDay: string | undefined = undefined;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          Seleccione equipos e ingrese los marcadores de cada partido.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {games.map((game, index) => {
          const showDay = game.day && game.day !== lastDay;
          if (showDay) {
            lastDay = game.day;
          }
          const isChampionship = title === "Partido Final";
          const gameNumber = isChampionship ? 16 : game.id;
          
          return (
            <Fragment key={game.id}>
              {showDay && <h3 className="font-bold text-lg pt-4">{game.day}</h3>}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-muted-foreground">
                  Juego {gameNumber} {game.time && `/ ${game.time}`}
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_min-content_2fr_1fr] gap-2 items-center">
                   <div className="p-2 text-sm text-center rounded-md bg-muted min-h-[40px] flex items-center justify-center">
                    {getTeamName(game.team1Id)}
                  </div>
                  <Input
                    type="number"
                    placeholder="Marcador"
                    value={game.score1}
                    onChange={(e) =>
                      onGameChange(game.id, "score1", e.target.value)
                    }
                  />
                  <span className="text-center text-muted-foreground font-semibold">
                    VS
                  </span>
                   <div className="p-2 text-sm text-center rounded-md bg-muted min-h-[40px] flex items-center justify-center">
                    {getTeamName(game.team2Id)}
                  </div>
                  <Input
                    type="number"
                    placeholder="Marcador"
                    value={game.score2}
                    onChange={(e) =>
                      onGameChange(game.id, "score2", e.target.value)
                    }
                  />
                </div>
              </div>
            </Fragment>
          );
        })}
      </CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}
