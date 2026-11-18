"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "../lib/cn";

export interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}

export function Sheet({ open, onClose, title, children, className }: SheetProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      onClose={onClose}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
      className={cn(
        "m-0 w-full max-w-none rounded-t-card bg-surface p-5 shadow-floating backdrop:bg-text/40",
        "fixed inset-x-0 bottom-0 top-auto max-h-[85vh] overflow-y-auto",
        "md:inset-0 md:m-auto md:max-h-none md:w-[520px] md:rounded-card",
        className,
      )}
    >
      <p className="mb-3 font-heading text-heading font-bold text-text">{title}</p>
      {children}
    </dialog>
  );
}
