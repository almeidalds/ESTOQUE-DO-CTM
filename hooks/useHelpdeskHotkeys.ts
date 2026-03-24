
import { useEffect } from 'react';

interface HotkeysProps {
  onF2?: () => void;
  onF3?: () => void;
  onF4?: () => void;
  onCtrlK?: () => void;
  onCtrlEnter?: () => void;
  onCtrlZ?: () => void;
  onEsc?: () => void;
}

export const useHelpdeskHotkeys = ({
  onF2,
  onF3,
  onF4,
  onCtrlK,
  onCtrlEnter,
  onCtrlZ,
  onEsc
}: HotkeysProps) => {
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2: Focus Missionary (Search)
      if (e.key === 'F2') {
        e.preventDefault();
        onF2?.();
      }

      // F3: Focus Item Search
      if (e.key === 'F3') {
        e.preventDefault();
        onF3?.();
      }

      // F4: Focus Queue / Toggle Mode
      if (e.key === 'F4') {
        e.preventDefault();
        onF4?.();
      }

      // Ctrl+K: Global Search / Item Search alternate
      if (e.ctrlKey && e.key === 'k') {
        e.preventDefault();
        onCtrlK?.();
      }

      // Ctrl+Enter: Confirm Transaction
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        onCtrlEnter?.();
      }

      // Ctrl+Z: Undo last item
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        onCtrlZ?.();
      }

      // Esc: Clear / Cancel
      if (e.key === 'Escape') {
        e.preventDefault();
        onEsc?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onF2, onF3, onF4, onCtrlK, onCtrlEnter, onCtrlZ, onEsc]);
};
