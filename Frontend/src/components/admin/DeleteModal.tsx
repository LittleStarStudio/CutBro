import { AlertTriangle } from "lucide-react";
import { useEffect, useRef } from "react";
import Button from "@/components/ui/Button";

interface DeleteModalProps {
  isOpen: boolean;
  title: string;
  itemName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function DeleteModal({
  isOpen,
  title,
  itemName,
  onConfirm,
  onCancel,
  isLoading = false,
}: DeleteModalProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  /* ===============================
     Lock scroll when open
  =============================== */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      confirmRef.current?.focus();
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  /* ===============================
     ESC to close
  =============================== */
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) onCancel();
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onCancel, isLoading]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={isLoading ? undefined : onCancel}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md mx-4 rounded-xl bg-white dark:bg-gray-800 p-6 shadow-xl animate-in fade-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30">
          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-center mb-2">{title}</h3>

        {/* Description */}
        <p className="text-sm text-muted-foreground text-center mb-6">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-foreground">"{itemName}"</span>?
          This action cannot be undone.
        </p>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>

          <Button
            ref={confirmRef}
            variant="destructive"
            className="flex-1"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
