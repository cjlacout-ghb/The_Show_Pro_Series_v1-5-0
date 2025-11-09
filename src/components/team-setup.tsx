
"use client";

import type { Team } from "@/lib/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TeamSetupProps = {
  teams: Team[];
  openAccordion: string | undefined;
  setOpenAccordion: (value: string | undefined) => void;
};

export default function TeamSetup({ teams, openAccordion, setOpenAccordion }: TeamSetupProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Equipos Participantes</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full" value={openAccordion} onValueChange={setOpenAccordion}>
          {teams.map((team) => (
            <AccordionItem value={`item-${team.id}`} key={team.id}>
              <AccordionTrigger>{team.name}</AccordionTrigger>
              <AccordionContent>
                {team.players.length > 0 ? (
                  <ul className="pl-4 list-disc space-y-1">
                    {team.players.map((player) => (
                      <li key={player.id} className="text-sm">
                        #{player.number} - {player.name} ({player.role}) - {player.placeOfBirth}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground pl-4">
                    El roster de jugadores se cargará pronto.
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
