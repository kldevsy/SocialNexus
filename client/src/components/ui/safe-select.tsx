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
      console.log("SafeSelect: Value changing from", value, "to", newValue);
      if (typeof newValue === 'string' || newValue === undefined) {
        onValueChange(newValue || "");
      } else {
        console.warn("SafeSelect: Invalid value type received:", typeof newValue, newValue);
        onValueChange("");
      }
    } catch (error) {
      console.error("SafeSelect: Error in onValueChange:", error);
      toast({
        title: "Erro",
        description: "Erro ao selecionar opção",
        variant: "destructive",
      });
      // Prevent crash by setting empty value
      onValueChange("");
    }
  }, [onValueChange, toast, value]);

  // Wrap in error boundary
  try {
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
  } catch (error) {
    console.error("SafeSelect: Render error:", error);
    return (
      <div className={className}>
        <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm">
          <span className="text-muted-foreground">{placeholder}</span>
        </div>
      </div>
    );
  }
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