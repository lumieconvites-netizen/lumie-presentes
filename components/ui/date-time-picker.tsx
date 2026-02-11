'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Check, X } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
}

export function DateTimePicker({ value, onChange, label }: DateTimePickerProps) {
  const [tempDate, setTempDate] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = () => {
    onChange(tempDate);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempDate(value);
    setIsOpen(false);
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return 'Selecione data e hora';
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-2">
      {label && <Label className="text-sm font-medium">{label}</Label>}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-start text-left font-normal hover:bg-gray-50 border-gray-300"
          >
            <Calendar className="mr-3 h-5 w-5 text-primary" />
            <span className={!value ? 'text-gray-400' : 'text-gray-900'}>
              {formatDisplayDate(value)}
            </span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4 space-y-4 bg-white rounded-lg shadow-lg">
            <div className="flex items-center gap-2 pb-3 border-b">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Selecione Data e Hora</p>
                <p className="text-xs text-gray-500">Escolha o dia e horário do evento</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <Input
                type="datetime-local"
                value={tempDate}
                onChange={(e) => setTempDate(e.target.value)}
                className="text-base border-gray-300 focus:ring-2 focus:ring-primary focus:border-primary"
              />
              
              {tempDate && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs font-medium text-blue-900 mb-1">Data selecionada:</p>
                  <p className="text-sm text-blue-700">{formatDisplayDate(tempDate)}</p>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="outline"
                className="flex-1 border-gray-300"
                onClick={handleCancel}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={handleConfirm}
                disabled={!tempDate}
              >
                <Check className="w-4 h-4 mr-2" />
                Confirmar
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
