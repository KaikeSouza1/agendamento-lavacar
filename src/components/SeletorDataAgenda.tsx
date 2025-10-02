"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SeletorDataAgendaProps {
  dataSelecionada: Date;
  onDataChange: (novaData: Date) => void;
}

export function SeletorDataAgenda({ dataSelecionada, onDataChange }: SeletorDataAgendaProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Selecione o dia para ver a agenda</CardTitle>
      </CardHeader>
      <CardContent>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn( "w-full justify-start text-left font-normal h-12 text-base", !dataSelecionada && "text-muted-foreground" )} >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dataSelecionada ? format(dataSelecionada, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dataSelecionada}
              onSelect={(date) => date && onDataChange(date)}
              initialFocus
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>
      </CardContent>
    </Card>
  );
}