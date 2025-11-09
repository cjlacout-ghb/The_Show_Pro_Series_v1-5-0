
"use client";

import type { Standing, Team } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "./ui/button";
import { ArrowUpCircle } from "lucide-react";

type StandingsTableProps = {
  standings: Standing[];
  teams: Team[];
  onNavigate?: () => void;
};

export default function StandingsTable({
  standings,
  teams,
  onNavigate
}: StandingsTableProps) {
  const tableColumns = ["POS", "TEAM", "W", "L", "RS", "RA", "PCT", "GB"];

  const getTeamName = (teamId: number) => {
    return teams.find((t) => t.id === teamId)?.name || "Unknown Team";
  };
  
  const formatPct = (pct: number) => {
    if (pct === 1000) return "1.000";
    return `.${pct.toString().padStart(3, '0')}`;
  }

  const isTied = (standing: Standing, index: number) => {
    if (index > 0 && standing.pos === standings[index - 1].pos) return true;
    if (index < standings.length - 1 && standing.pos === standings[index + 1].pos) return true;
    return false;
  }
  
  const hasTies = standings.some(isTied);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Posiciones</CardTitle>
        <CardDescription>
          Las posiciones se actualizan automáticamente con los resultados de la ronda inicial.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {tableColumns.map((col) => (
                  <TableHead key={col} className={col === "TEAM" ? "w-[40%]" : ""}>
                    {col}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {standings.map((standing, index) => (
                <TableRow key={standing.teamId}>
                  <TableCell>
                    {isTied(standing, index) ? `(*) ${standing.pos}` : standing.pos}
                  </TableCell>
                  <TableCell className="font-medium">
                    {getTeamName(standing.teamId)}
                  </TableCell>
                  <TableCell>{standing.w}</TableCell>
                  <TableCell>{standing.l}</TableCell>
                  <TableCell>{standing.rs}</TableCell>
                  <TableCell>{standing.ra}</TableCell>
                  <TableCell>{formatPct(standing.pct)}</TableCell>
                  <TableCell>{standing.gb === 0 ? "-" : standing.gb.toFixed(1)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2">
          {hasTies && (
            <p className="text-xs text-muted-foreground">(*) Equipos empatados</p>
          )}
          {onNavigate && (
            <div className="flex justify-end w-full">
                <Button variant="secondary" onClick={onNavigate}>
                    <ArrowUpCircle className="mr-2 h-4 w-4" />
                    Volver al inicio
                </Button>
            </div>
          )}
      </CardFooter>
    </Card>
  );
}
