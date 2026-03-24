
import React, { useEffect, useState, useCallback } from 'react';

interface ScannerHookProps {
  onScanItem: (code: string) => void;
  onScanMissionary: (code: string) => void;
  onConfirm: () => void;
  onClear: () => void;
  onUndo: () => void;
  focusRefs: {
    missionaryInput: React.RefObject<HTMLInputElement>;
    itemInput: React.RefObject<HTMLInputElement>;
    searchInput: React.RefObject<HTMLInputElement>;
  };
}

export const useHelpdeskScanner = ({ 
  onScanItem, 
  onScanMissionary, 
  onConfirm, 
  onClear,
  onUndo,
  focusRefs 
}: ScannerHookProps) => {
  
  // Detecção de Scanner USB (Buffer de teclas)
  // Scanners USB enviam teclas muito rápido (ex: 20ms entre teclas) e terminam com Enter.
  const [buffer, setBuffer] = useState('');
  const [lastKeyTime, setLastKeyTime] = useState(0);

  const handleGlobalKeyDown = useCallback((e: KeyboardEvent) => {
    const now = Date.now();
    const char = e.key;
    const isRapid = now - lastKeyTime < 50; // 50ms threshold for "machine typing"
    
    // --- ATALHOS DE FUNÇÃO (F-Keys & Ctrl) ---
    
    // F2: Focar Missionário
    if (e.key === 'F2') {
      e.preventDefault();
      focusRefs.missionaryInput.current?.focus();
      focusRefs.missionaryInput.current?.select();
      return;
    }

    // F3: Focar Item Scanner (Input Principal)
    if (e.key === 'F3') {
      e.preventDefault();
      focusRefs.itemInput.current?.focus();
      focusRefs.itemInput.current?.select();
      return;
    }

    // Ctrl+K: Busca Global (Estoque)
    if (e.ctrlKey && e.key === 'k') {
      e.preventDefault();
      focusRefs.searchInput.current?.focus();
      return;
    }

    // Ctrl+Enter: Confirmar Entrega
    if (e.ctrlKey && e.key === 'Enter') {
      e.preventDefault();
      onConfirm();
      return;
    }

    // Esc: Cancelar / Limpar
    if (e.key === 'Escape') {
      e.preventDefault();
      onClear();
      return;
    }

    // Ctrl+Z: Desfaz último scan
    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      onUndo();
      return;
    }

    // --- LÓGICA DE SCANNER USB (BUFFER) ---
    // Se não estiver focando um input de texto editável (exceto os nossos controlados), tenta capturar
    const target = e.target as HTMLElement;
    const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
    
    // Se for Enter, processa o buffer
    if (e.key === 'Enter') {
      if (buffer.length > 2) {
        // Analisa o buffer
        if (buffer.startsWith('CTM|MIS|') || buffer.length < 8) { 
           // Assume missionário se for prefixo MIS ou ID curto (ex: crachá antigo)
           // Mas cuidado: ID de item curto pode confundir. Padrão CTM é seguro.
           if (buffer.startsWith('CTM|ITEM|')) {
             onScanItem(buffer);
           } else {
             // Tenta missionário primeiro se não for explicitamente item
             onScanMissionary(buffer);
           }
        } else {
           // Default to item scan
           onScanItem(buffer);
        }
        setBuffer('');
        // Se foi um scan rápido, previne o Enter de submitar forms indesejados
        if (isRapid) e.preventDefault();
      } else {
        // Enter normal (manual submit de input)
        // Deixa passar
      }
      return;
    }

    // Acumula caracteres imprimíveis
    if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
      if (isRapid) {
        setBuffer(prev => prev + char);
      } else {
        // Se demorou muito, reseta buffer e começa novo (digitação humana lenta)
        setBuffer(char); 
      }
      setLastKeyTime(now);
    }
  }, [buffer, lastKeyTime, onScanItem, onScanMissionary, onConfirm, onClear, onUndo, focusRefs]);

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);
};
