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
import { Input } from "@/components/ui/input";

type StandingsTableProps = {
  standings: Standing[];
  teams: Team[];
  onStandingChange: (teamId: number, field: keyof Omit<Standing, 'teamId'>, value: string) => void;
};

export default function StandingsTable({
  standings,
  teams,
  onStandingChange,
}: StandingsTableProps) {
  const tableColumns = ["POS", "TEAM", "W", "L", "RS", "RA", "PCT", "GB"];
  const editableFields: (keyof Omit<Standing, 'teamId'>)[] = ['pos', 'w', 'l', 'rs', 'ra', 'pct', 'gb'];

  const getTeamName = (teamId: number) => {
    return teams.find((t) => t.id === teamId)?.name || "Unknown Team";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Standings</CardTitle>
        <CardDescription>
          Manually update the team standings below.
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
                  {editableFields.map((field) => (
                     field === 'pos' ? (
                      <TableCell key={field}>
                        <Input
                          value={standing[field]}
                          onChange={(e) => onStandingChange(standing.teamId, field, e.target.value)}
                          className="w-12"
                        />
                      </TableCell>
                     ) : null
                  ))}
                  <TableCell className="font-medium">
                    {getTeamName(standing.teamId)}
                  </TableCell>
                  {editableFields.filter(f => f !== 'pos').map(field => (
                    <TableCell key={field}>
                      <Input
                        value={standing[field]}
                        onChange={(e) => onStandingChange(standing.teamId, field, e.target.value)}
                        className="w-16"
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
