
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
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

type ScheduleCardProps = {
  title: string;
  games: Game[];
  teams: Team[];
  onGameChange: (gameId: number, field: keyof Game, value: string) => void;
  onInningChange: (gameId: number, inningIndex: number, teamIndex: 0 | 1, value: string) => void;
  onNavigate?: () => void;
  footer?: React.ReactNode;
  isChampionship?: boolean;
};

export default function ScheduleCard({
  title,
  games,
  teams,
  onGameChange,
  onInningChange,
  onNavigate,
  footer,
  isChampionship = false
}: ScheduleCardProps) {
  const getTeamName = (teamId: string) => {
    return teams.find((t) => String(t.id) === teamId)?.name || "";
  };
  
  let lastDay: string | undefined = undefined;

  const getTeamPlaceholder = (game: Game, teamNumber: 1 | 2) => {
      const teamId = teamNumber === 1 ? game.team1Id : game.team2Id;
      if (!isChampionship) {
        return getTeamName(teamId);
      }
      if (game.team1Id && game.team2Id) {
        return getTeamName(teamId);
      }
      return teamNumber === 1 ? "2° RONDA INICIAL" : "1° RONDA INICIAL";
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {!isChampionship && (
          <CardDescription>
            Agregue una 'X' en las entradas no jugadas. Se agregarán entradas adicionales si es necesario.
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {games.map((game) => {
          const showDay = game.day && game.day !== lastDay;
          if (showDay) {
            lastDay = game.day;
          }
          const gameNumber = isChampionship ? 16 : game.id;
          const inningsCount = game.innings.length;

          const score1Num = game.score1 !== "" ? parseInt(game.score1) : -1;
          const score2Num = game.score2 !== "" ? parseInt(game.score2) : -1;

          const team1Wins = score1Num > score2Num;
          const team2Wins = score2Num > score1Num;
          
          return (
            <Fragment key={game.id}>
              {showDay && <h3 className="font-bold text-lg pt-4">{game.day}</h3>}
              <div className="space-y-4 rounded-lg border p-4">
                <Label className="text-sm font-medium text-muted-foreground">
                  Juego {gameNumber} {game.time && `/ ${game.time}`}
                </Label>
                
                {/* Team Names & Total Scores */}
                <div className="grid grid-cols-[1fr_80px] gap-4">
                    <div className={cn(
                        "p-2 text-sm rounded-md bg-muted min-h-[40px] flex items-center justify-center font-semibold",
                        team1Wins && "text-primary font-bold border border-primary"
                    )}>
                        {getTeamPlaceholder(game, 1)}
                    </div>
                    <Input
                        type="number"
                        readOnly
                        value={game.score1}
                        className={cn(
                          "font-bold text-center text-lg",
                          team1Wins && "text-primary border-primary font-bold"
                        )}
                        placeholder="R"
                    />
                     <div className={cn(
                        "p-2 text-sm rounded-md bg-muted min-h-[40px] flex items-center justify-center font-semibold",
                        team2Wins && "text-primary font-bold border border-primary"
                     )}>
                        {getTeamPlaceholder(game, 2)}
                    </div>
                    <Input
                        type="number"
                        readOnly
                        value={game.score2}
                        className={cn(
                          "font-bold text-center text-lg",
                           team2Wins && "text-primary border-primary font-bold"
                        )}
                        placeholder="R"
                    />
                </div>
                
                <Separator />
                
                {/* Inning-by-inning scores */}
                <div className="overflow-x-auto">
                  <div className="grid grid-cols-[3rem_repeat(12,minmax(0,1fr))] gap-2 items-center text-xs text-center font-semibold text-muted-foreground mb-2" style={{minWidth: `${3 + inningsCount * 3.5}rem`}}>
                     <div />
                     {Array.from({ length: inningsCount }, (_, i) => i + 1).map(inning => <div key={inning}>{inning}</div>)}
                  </div>
                  {/* Team 1 Innings */}
                  <div className="grid grid-cols-[3rem_repeat(12,minmax(0,1fr))] gap-2 items-center" style={{minWidth: `${3 + inningsCount * 3.5}rem`}}>
                    <div className="text-xs font-semibold text-right pr-2">VIS</div>
                    {game.innings.map((inningData, inningNum) => (
                      <Input
                        key={`g${game.id}-t1-inn${inningNum}`}
                        type="text"
                        placeholder=""
                        className="text-center"
                        value={inningData[0]}
                        onChange={(e) => onInningChange(game.id, inningNum, 0, e.target.value)}
                      />
                    ))}
                  </div>
                   {/* Team 2 Innings */}
                   <div className="grid grid-cols-[3rem_repeat(12,minmax(0,1fr))] gap-2 items-center mt-2" style={{minWidth: `${3 + inningsCount * 3.5}rem`}}>
                    <div className="text-xs font-semibold text-right pr-2">LOC</div>
                    {game.innings.map((inningData, inningNum) => (
                      <Input
                        key={`g${game.id}-t2-inn${inningNum}`}
                        type="text"
                        placeholder=""
                        className="text-center"
                        value={inningData[1]}
                        onChange={(e) => onInningChange(game.id, inningNum, 1, e.target.value)}
                      />
                    ))}
                  </div>
                </div>

                {!isChampionship && onNavigate && (
                   <div className="flex justify-end pt-4">
                      <Button variant="secondary" onClick={onNavigate}>Ir a Posiciones</Button>
                  </div>
                )}
              </div>
            </Fragment>
          );
        })}
      </CardContent>
      {footer && <CardFooter>{footer}</CardFooter>}
    </Card>
  );
}

    