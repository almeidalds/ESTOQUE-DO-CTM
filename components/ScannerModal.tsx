
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { X, Camera, AlertTriangle, RefreshCw } from 'lucide-react';
import { decodeItemQr } from '../utils/qrFormat';

interface ScannerModalProps {
  onScanSuccess: (decodedText: string, itemId: string) => void;
  onClose: () => void;
}

const ScannerModal: React.FC<ScannerModalProps> = ({ onScanSuccess, onClose }) => {
  const scannerRegionId = 'html5qr-code-full-region';
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);

  useEffect(() => {
    const startScanner = async () => {
      try {
        // Verifica HTTPS (obrigatório para câmera, exceto localhost)
        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
          throw new Error("A câmera requer conexão segura (HTTPS).");
        }

        const html5QrCode = new Html5Qrcode(scannerRegionId);
        scannerRef.current = html5QrCode;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
        };

        await html5QrCode.start(
          { facingMode: "environment" }, // Preferência pela câmera traseira
          config,
          (decodedText) => {
            // Sucesso na leitura
            handleScan(decodedText);
          },
          (errorMessage) => {
            // Erros de leitura contínuos (ignorados para não poluir, apenas log se crítico)
            // console.debug(errorMessage); 
          }
        );
      } catch (err: any) {
        console.error("Erro ao iniciar scanner:", err);
        setError(err.message || "Não foi possível acessar a câmera. Verifique as permissões.");
        setIsScanning(false);
      }
    };

    startScanner();

    // Cleanup ao desmontar
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => {
          scannerRef.current?.clear();
        }).catch(err => console.error("Erro ao parar scanner:", err));
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleScan = (decodedText: string) => {
    // Pausa o scanner para evitar leituras duplicadas rápidas
    if (scannerRef.current) {
      scannerRef.current.pause();
    }

    try {
      // Tenta decodificar usando o padrão CTM
      const itemId = decodeItemQr(decodedText);
      onScanSuccess(decodedText, itemId);
    } catch (e: any) {
      alert(`QR Code Inválido: ${e.message}\n\nLido: ${decodedText}`);
      // Retoma o scanner se o QR for inválido
      if (scannerRef.current) {
        scannerRef.current.resume();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black flex flex-col items-center justify-center animate-fade-in">
      {/* Header Mobile */}
      <div className="absolute top-0 w-full p-4 flex justify-between items-center z-10 bg-gradient-to-b from-black/80 to-transparent">
        <div className="text-white flex items-center gap-2">
          <Camera className="text-blue-400" />
          <span className="font-bold">Escanear QR Item</span>
        </div>
        <button 
          onClick={onClose}
          className="bg-white/20 p-2 rounded-full text-white backdrop-blur-sm hover:bg-white/30"
        >
          <X size={24} />
        </button>
      </div>

      {/* Área do Scanner */}
      <div className="w-full h-full relative flex items-center justify-center bg-black">
        <div id={scannerRegionId} className="w-full max-w-md overflow-hidden rounded-xl"></div>
        
        {/* Overlay de carregamento ou erro */}
        {!isScanning && error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white bg-gray-900">
             <AlertTriangle size={48} className="text-red-500 mb-4" />
             <h3 className="text-xl font-bold mb-2">Erro na Câmera</h3>
             <p className="text-gray-400 mb-6">{error}</p>
             <button 
               onClick={() => window.location.reload()}
               className="px-6 py-3 bg-blue-600 rounded-lg font-bold flex items-center gap-2"
             >
               <RefreshCw size={20} /> Recarregar Página
             </button>
          </div>
        )}
      </div>

      {/* Footer Instruções */}
      <div className="absolute bottom-10 px-6 py-3 bg-black/60 backdrop-blur-md rounded-full text-white text-sm font-medium border border-white/10">
        Aponte para o código <strong>CTM</strong> do item
      </div>
    </div>
  );
};

export default ScannerModal;
