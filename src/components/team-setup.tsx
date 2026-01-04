
"use client";

import { useState } from "react";
import type { Team } from "@/lib/types";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { importPlayers, updatePlayer } from "@/app/actions";
import { Upload, Pencil, Check, X } from "lucide-react";
import { Separator } from "@/components/ui/separator";

// Helper to check if a role is considered "Staff"
const isStaff = (role: string) => {
  const r = role.toUpperCase();
  return r.includes("MANAGER") || r.includes("COACH") || r.includes("DELEGADO") || r.includes("PRINCIPAL") || r.includes("TRAINER") || r.includes("MEDICO");
};

type TeamSetupProps = {
  teams: Team[];
  openAccordion: string | undefined;
  setOpenAccordion: (value: string | undefined) => void;
  onNavigate?: () => void;
};

export default function TeamSetup({ teams, openAccordion, setOpenAccordion, onNavigate }: TeamSetupProps) {
  const [importingTeam, setImportingTeam] = useState<Team | null>(null);
  const [csvData, setCsvData] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  // Edit State
  const [editingPlayerId, setEditingPlayerId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ number: "", name: "", role: "", placeOfBirth: "" });

  const { toast } = useToast();

  const handleOpenImport = (team: Team) => {
    setImportingTeam(team);
    setCsvData("");
  };

  const handleImport = async () => {
    if (!importingTeam || !csvData.trim()) return;

    setIsImporting(true);
    console.log("Submitting import data...");

    try {
      const result = await importPlayers(importingTeam.id, csvData);
      console.log("Import result:", result);

      if (result.success) {
        if (result.count > 0) {
          toast({
            title: "Importación Exitosa",
            description: `Se han importado ${result.count} jugadores a ${importingTeam.name}.`,
          });
          setImportingTeam(null);
        } else {
          toast({
            variant: "warning",
            title: "Atención",
            description: "El proceso terminó pero no se detectaron jugadores. Verifique el formato.",
          });
        }
      }
    } catch (error) {
      console.error("Client import error:", error);
      toast({
        variant: "destructive",
        title: "Error de Importación",
        description: "Hubo un problema al procesar los datos. Revise la consola.",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleEditClick = (player: any) => {
    setEditingPlayerId(player.id);
    setEditForm({
      number: player.number.toString(),
      name: player.name,
      role: player.role,
      placeOfBirth: player.placeOfBirth
    });
  };

  const handleCancelEdit = () => {
    setEditingPlayerId(null);
  };

  const handleSaveEdit = async () => {
    if (!editingPlayerId) return;

    try {
      await updatePlayer(editingPlayerId, {
        number: parseInt(editForm.number) || 0,
        name: editForm.name,
        role: editForm.role,
        placeOfBirth: editForm.placeOfBirth
      });
      toast({ title: "Jugador actualizado" });
      setEditingPlayerId(null);
    } catch (error) {
      toast({ variant: "destructive", title: "Error al actualizar", description: "Intente nuevamente" });
    }
  };

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
              <AccordionContent className="space-y-4">
                {team.players.length > 0 ? (
                  <ul className="pl-2 space-y-2">
                    {team.players.map((player, index) => {
                      // Check for staff transition
                      const isFirstStaff = index > 0 && isStaff(player.role) && !isStaff(team.players[index - 1].role);

                      return (
                        <div key={player.id}>
                          {isFirstStaff && (
                            <Separator className="my-2 bg-muted-foreground/20" />
                          )}
                          <li className="text-sm flex items-center gap-2 group">
                            {editingPlayerId === player.id ? (
                              <div className="flex items-center gap-2 w-full">
                                <Input
                                  className="w-16 h-7 text-xs"
                                  value={editForm.number}
                                  onChange={e => setEditForm({ ...editForm, number: e.target.value })}
                                  placeholder="#"
                                />
                                <Input
                                  className="flex-1 h-7 text-xs"
                                  value={editForm.name}
                                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                  placeholder="Nombre"
                                />
                                <Input
                                  className="w-24 h-7 text-xs"
                                  value={editForm.role}
                                  onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                                  placeholder="Pos"
                                />
                                <Input
                                  className="w-24 h-7 text-xs"
                                  value={editForm.placeOfBirth}
                                  onChange={e => setEditForm({ ...editForm, placeOfBirth: e.target.value })}
                                  placeholder="País"
                                />
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={handleSaveEdit}>
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={handleCancelEdit}>
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <span className="flex-1">
                                  <span className="font-mono font-bold mr-2">#{player.number}</span>
                                  {player.name}
                                  <span className="text-muted-foreground ml-2 text-xs">({player.role} - {player.placeOfBirth})</span>
                                </span>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleEditClick(player)}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </li>
                        </div>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground pl-4">
                    El roster de jugadores se cargará pronto.
                  </p>
                )}

                <div className="pt-2 pl-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenImport(team)}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    Importar Jugadores
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
      {onNavigate && (
        <CardFooter className="flex justify-end w-full">
          <Button variant="secondary" onClick={onNavigate}>
            Ir al inicio
          </Button>
        </CardFooter>
      )}

      <Dialog open={!!importingTeam} onOpenChange={(open) => !open && setImportingTeam(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Importar Jugadores - {importingTeam?.name}</DialogTitle>
            <DialogDescription>
              Pega la lista de jugadores aquí. El sistema detectará automáticamente los datos.
              <br />
              <span className="text-xs text-muted-foreground">Ejemplo: 21, SOSA LOYOLA, MARTIN JORGE...</span>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              value={csvData}
              onChange={(e) => setCsvData(e.target.value)}
              placeholder={`TEAM FINCA JUJURE (VEN)\nUNIFORME N°, APELLIDOS, NOMBRES...\n21, SOSA LOYOLA, MARTIN JORGE, INFIELDER, VENEZUELA`}
              className="h-[200px] font-mono text-sm"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportingTeam(null)}>Cancelar</Button>
            <Button onClick={handleImport} disabled={isImporting || !csvData.trim()}>
              {isImporting ? "Importando..." : "Procesar Importación"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

