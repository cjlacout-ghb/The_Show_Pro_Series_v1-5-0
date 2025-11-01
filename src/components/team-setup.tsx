"use client";

import type { Team } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

type TeamSetupProps = {
  teams: Team[];
  onTeamNameChange: (id: number, newName: string) => void;
};

export default function TeamSetup({ teams, onTeamNameChange }: TeamSetupProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Setup</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72">
          <div className="space-y-4 pr-6">
            {teams.map((team, index) => (
              <div key={team.id} className="space-y-2">
                <Label htmlFor={`team-${team.id}`}>Team {index + 1}</Label>
                <Input
                  id={`team-${team.id}`}
                  value={team.name}
                  onChange={(e) => onTeamNameChange(team.id, e.target.value)}
                  placeholder="Enter team name"
                />
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
