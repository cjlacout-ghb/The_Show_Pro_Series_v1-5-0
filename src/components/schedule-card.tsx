
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
  isChampionship?: boolean;
};

export default function ScheduleCard({
  title,
  games,
  teams,
  onGameChange,
  footer,
  isChampionship = false
}: ScheduleCardProps) {
  const getTeamName = (teamId: string) => {
    return teams.find((t) => String(t.id) === teamId)?.name || "";
  };
  
  let lastDay: string | undefined = undefined;

  const getTeamPlaceholder = (game: Game, teamNumber: 1 | 2) => {
      if (!isChampionship) {
        return getTeamName(teamNumber === 1 ? game.team1Id : game.team2Id);
      }
      if (game.team1Id && game.team2Id) {
        return getTeamName(teamNumber === 1 ? game.team1Id : game.team2Id);
      }
      return teamNumber === 1 ? "2° RONDA INICIAL" : "1° RONDA INICIAL";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {games.map((game, index) => {
          const showDay = game.day && game.day !== lastDay;
          if (showDay) {
            lastDay = game.day;
          }
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
                    {getTeamPlaceholder(game, 1)}
                  </div>
                  <Input
                    type="number"
                    placeholder=""
                    value={game.score1}
                    onChange={(e) =>
                      onGameChange(game.id, "score1", e.target.value)
                    }
                  />
                  <span className="text-center text-muted-foreground font-semibold">
                    VS
                  </span>
                   <div className="p-2 text-sm text-center rounded-md bg-muted min-h-[40px] flex items-center justify-center">
                    {getTeamPlaceholder(game, 2)}
                  </div>
                  <Input
                    type="number"
                    placeholder=""
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
