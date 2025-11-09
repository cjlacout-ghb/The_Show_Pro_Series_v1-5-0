
"use client";

import type { Team } from "@/lib/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "./ui/button";
import { ArrowUpCircle } from "lucide-react";

type TeamSetupProps = {
  teams: Team[];
  openAccordion: string | undefined;
  setOpenAccordion: (value: string | undefined) => void;
  onNavigate?: () => void;
};

export default function TeamSetup({ teams, openAccordion, setOpenAccordion, onNavigate }: TeamSetupProps) {
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
      {onNavigate && (
        <CardFooter className="flex justify-end w-full">
            <Button variant="secondary" onClick={onNavigate}>
                <ArrowUpCircle className="mr-2 h-4 w-4" />
                Volver al inicio
            </Button>
        </CardFooter>
      )}
    </Card>
  );
}
