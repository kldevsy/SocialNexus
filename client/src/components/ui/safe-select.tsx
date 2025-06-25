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
  const [isOpen, setIsOpen] = React.useState(false);

  const handleValueChange = React.useCallback((newValue: string) => {
    try {
      console.log("SafeSelect: Value changing from", value, "to", newValue);
      
      // Validate the new value
      if (typeof newValue !== 'string') {
        console.warn("SafeSelect: Invalid value type received:", typeof newValue, newValue);
        return;
      }
      
      // Call the parent's onChange safely
      if (typeof onValueChange === 'function') {
        onValueChange(newValue);
      }
      
      setIsOpen(false);
    } catch (error) {
      console.error("SafeSelect: Error in onValueChange:", error);
      toast({
        title: "Erro",
        description: "Erro ao selecionar opção",
        variant: "destructive",
      });
    }
  }, [onValueChange, toast, value]);

  const fallbackElement = (
    <div className={className}>
      <div className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm">
        <span className="text-muted-foreground">{placeholder || "Selecione uma opção"}</span>
      </div>
    </div>
  );

  return (
    <SelectErrorBoundary fallback={fallbackElement}>
      <Select 
        value={value || ""} 
        onValueChange={handleValueChange}
        disabled={disabled}
        open={isOpen}
        onOpenChange={setIsOpen}
      >
        <SelectTrigger className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {React.Children.map(children, (child, index) => {
            if (!React.isValidElement(child)) {
              return null;
            }
            return React.cloneElement(child, { key: index });
          })}
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