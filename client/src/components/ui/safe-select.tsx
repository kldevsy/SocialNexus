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

class SelectErrorBoundary extends React.Component<{children: React.ReactNode, fallback: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode, fallback: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any) {
    console.error("SelectErrorBoundary caught error:", error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
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
      console.log("SafeSelect: Categoria selecionada:", newValue);
      
      if (typeof newValue === 'string' && newValue.length > 0) {
        onValueChange(newValue);
      }
    } catch (error) {
      console.error("SafeSelect: Erro ao selecionar:", error);
      toast({
        title: "Erro",
        description: "Erro ao selecionar categoria",
        variant: "destructive",
      });
    }
  }, [onValueChange, toast]);

  const fallbackElement = (
    <div className={className}>
      <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm">
        <span className="text-muted-foreground">{value || placeholder || "Selecione uma categoria"}</span>
      </div>
    </div>
  );

  return (
    <SelectErrorBoundary fallback={fallbackElement}>
      <Select 
        value={value} 
        onValueChange={handleValueChange}
        disabled={disabled}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder}>
            {value || placeholder}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {children}
        </SelectContent>
      </Select>
    </SelectErrorBoundary>
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