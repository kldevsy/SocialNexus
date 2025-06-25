import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface TestEmbedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TestEmbedModal({ open, onOpenChange }: TestEmbedModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Test Modal</DialogTitle>
        </DialogHeader>
        <div className="p-4">
          <p>Este é um modal de teste para verificar se o sistema de modal está funcionando.</p>
          <Button onClick={() => onOpenChange(false)} className="mt-4">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}