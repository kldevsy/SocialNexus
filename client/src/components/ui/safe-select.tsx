import * as React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { useToast } from "@/hooks/use-toast";

interface SafeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function SafeSelect({ 
  value, 
  onValueChange, 
  placeholder, 
  children, 
  className,
  disabled = false 
}: SafeSelectProps) {
  const { toast } = useToast();

  const handleValueChange = React.useCallback((newValue: string) => {
    try {
      if (typeof newValue === 'string') {
        onValueChange(newValue);
      } else {
        console.warn("SafeSelect: Invalid value type received:", typeof newValue);
        onValueChange("");
      }
    } catch (error) {
      console.error("SafeSelect: Error in onValueChange:", error);
      toast({
        title: "Erro",
        description: "Erro ao selecionar opção",
        variant: "destructive",
      });
    }
  }, [onValueChange, toast]);

  return (
    <Select 
      value={value || ""} 
      onValueChange={handleValueChange}
      disabled={disabled}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {children}
      </SelectContent>
    </Select>
  );
}

interface SafeSelectItemProps {
  value: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export function SafeSelectItem({ value, children, disabled = false }: SafeSelectItemProps) {
  if (!value) {
    console.warn("SafeSelectItem: Empty value provided");
    return null;
  }

  return (
    <SelectItem value={value} disabled={disabled}>
      {children}
    </SelectItem>
  );
}