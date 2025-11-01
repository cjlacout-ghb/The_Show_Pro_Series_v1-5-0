
"use client";

import type { Standing, Team } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type StandingsTableProps = {
  standings: Standing[];
  teams: Team[];
};

export default function StandingsTable({
  standings,
  teams,
}: StandingsTableProps) {
  const tableColumns = ["POS", "TEAM", "W", "L", "RS", "RA", "PCT", "GB"];

  const getTeamName = (teamId: number) => {
    return teams.find((t) => t.id === teamId)?.name || "Unknown Team";
  };
  
  const formatPct = (pct: number) => {
    if (pct === 1000) return "1.000";
    return `.${pct.toString().padStart(3, '0')}`;
  }

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
              {standings.map((standing) => (
                <TableRow key={standing.teamId}>
                  <TableCell>{standing.pos}</TableCell>
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
    </Card>
  );
}
