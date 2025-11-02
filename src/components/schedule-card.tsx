
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

type ScheduleCardProps = {
  title: string;
  games: Game[];
  teams: Team[];
  onGameChange: (gameId: number, field: keyof Game, value: string) => void;
  onInningChange: (gameId: number, inningIndex: number, teamIndex: 0 | 1, value: string) => void;
  onSave?: () => void;
  footer?: React.ReactNode;
  isChampionship?: boolean;
};

export default function ScheduleCard({
  title,
  games,
  teams,
  onGameChange,
  onInningChange,
  onSave,
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
        {games.map((game, index) => {
          const showDay = game.day && game.day !== lastDay;
          if (showDay) {
            lastDay = game.day;
          }
          const gameNumber = isChampionship ? 16 : game.id;
          const inningsCount = game.innings.length;
          
          return (
            <Fragment key={game.id}>
              {showDay && <h3 className="font-bold text-lg pt-4">{game.day}</h3>}
              <div className="space-y-4 rounded-lg border p-4">
                <Label className="text-sm font-medium text-muted-foreground">
                  Juego {gameNumber} {game.time && `/ ${game.time}`}
                </Label>
                
                {/* Team Names & Total Scores */}
                <div className="grid grid-cols-[1fr_80px] gap-4">
                    <div className="p-2 text-sm rounded-md bg-muted min-h-[40px] flex items-center justify-center font-semibold">
                        {getTeamPlaceholder(game, 1)}
                    </div>
                    <Input
                        type="number"
                        readOnly
                        value={game.score1}
                        className="font-bold text-center text-lg"
                        placeholder="R"
                    />
                     <div className="p-2 text-sm rounded-md bg-muted min-h-[40px] flex items-center justify-center font-semibold">
                        {getTeamPlaceholder(game, 2)}
                    </div>
                    <Input
                        type="number"
                        readOnly
                        value={game.score2}
                        className="font-bold text-center text-lg"
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

                {!isChampionship && onSave && (
                   <div className="flex justify-end pt-4">
                      <Button onClick={onSave}>Guardar Resultados y Actualizar Posiciones</Button>
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
