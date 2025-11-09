
"use client";

import type { Team } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type TeamSetupProps = {
  teams: Team[];
};

export default function TeamSetup({ teams }: TeamSetupProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipos Participantes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {teams.map((team) => (
            <Button
              key={team.id}
              variant="outline"
              className="w-full justify-start text-left h-auto"
            >
              {team.name}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
