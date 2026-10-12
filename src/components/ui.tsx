"use client";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
export { Button };
export function TextInputDialog({
  open,
  onOpenChange,
  title,
  label,
  value,
  onValueChange,
  confirm,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  confirm: string;
  onConfirm: (value: string) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description>
            Choose a name for this project.
          </Dialog.Description>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              const trimmed = value.trim();
              if (trimmed) onConfirm(trimmed);
            }}
          >
            <label className="field">
              {label}
              <input
                autoFocus
                value={value}
                onChange={(event) => onValueChange(event.target.value)}
                maxLength={100}
                required
              />
            </label>
            <div className="dialog-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!value.trim()}>
                {confirm}
              </Button>
            </div>
          </form>
          <Dialog.Close className="dialog-close" aria-label="Close">
            <X size={18} />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirm,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirm: string;
  onConfirm: () => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="dialog-overlay" />
        <Dialog.Content className="dialog-content">
          <Dialog.Title>{title}</Dialog.Title>
          <Dialog.Description>{description}</Dialog.Description>
          <div className="dialog-actions">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                onConfirm();
                onOpenChange(false);
              }}
            >
              {confirm}
            </Button>
          </div>
          <Dialog.Close className="dialog-close" aria-label="Close">
            <X size={18} />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
