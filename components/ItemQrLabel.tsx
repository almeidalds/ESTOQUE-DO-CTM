
import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { encodeItemQr } from '../utils/qrFormat';
import { Printer, Loader2 } from 'lucide-react';

interface ItemQrLabelProps {
  itemId: string;
  itemName: string;
  unit?: string;
  category?: string;
}

const ItemQrLabel: React.FC<ItemQrLabelProps> = ({ itemId, itemName, unit, category }) => {
  const [qrSrc, setQrSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Payload formatado: CTM|ITEM|<ID>
  const qrPayload = encodeItemQr(itemId);

  useEffect(() => {
    // Gera o QR Code em alta qualidade para impressão
    QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'M', // M (Medium) é bom equilíbrio para escaneamento mobile
      margin: 4, // Margem de segurança obrigatória
      width: 400, // Alta resolução
      color: {
        dark: '#000000',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        setQrSrc(url);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erro ao gerar QR:', err);
        setLoading(false);
      });
  }, [qrPayload]);

  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=600,height=600');
    if (!printWindow) return;

    const htmlContent = `
      <html>
        <head>
          <title>Etiqueta - ${itemName}</title>
          <style>
            body { font-family: sans-serif; text-align: center; margin: 0; padding: 20px; }
            .label-container {
              border: 2px solid #000;
              border-radius: 8px;
              padding: 20px;
              max-width: 350px;
              margin: 0 auto;
              page-break-inside: avoid;
            }
            .header { font-size: 14px; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }
            .item-name { font-size: 22px; font-weight: 900; line-height: 1.2; margin-bottom: 10px; }
            .qr-code { width: 250px; height: 250px; margin: 0 auto; display: block; }
            .meta { font-size: 16px; margin-top: 5px; font-weight: 500; }
            .footer { font-size: 10px; color: #555; margin-top: 10px; font-family: monospace; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="label-container">
            <div class="header">CTM Brasil • Controle de Estoque</div>
            <div class="item-name">${itemName}</div>
            <img src="${qrSrc}" class="qr-code" />
            <div class="meta">ID: <strong>${itemId}</strong> ${unit ? `• ${unit}` : ''}</div>
            ${category ? `<div style="font-size: 14px; color: #444;">${category}</div>` : ''}
            <div class="footer">${qrPayload}</div>
          </div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  return (
    <div className="flex flex-col items-center animate-fade-in">
      <div className="bg-white border-2 border-gray-800 p-6 rounded-lg shadow-lg max-w-[300px] text-center mb-6">
        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">CTM Brasil</div>
        <h2 className="text-xl font-black text-gray-900 leading-tight mb-4">{itemName}</h2>
        
        <div className="bg-white p-2 border border-gray-100 rounded mb-4 flex justify-center min-h-[200px] items-center">
          {loading ? (
            <Loader2 className="animate-spin text-gray-400" size={32} />
          ) : (
            <img src={qrSrc} alt="QR Code" className="w-48 h-48 object-contain" />
          )}
        </div>

        <div className="font-mono text-lg font-bold text-gray-800">{itemId}</div>
        <div className="text-sm text-gray-500 font-medium mt-1">
          {category} {unit && `• ${unit}`}
        </div>
        <div className="mt-3 pt-3 border-t border-gray-100 text-[10px] text-gray-400 font-mono break-all">
          Payload: {qrPayload}
        </div>
      </div>

      <button
        onClick={handlePrint}
        disabled={loading}
        className="flex items-center gap-2 px-8 py-3 bg-[#324F85] text-white rounded-xl font-bold shadow-lg hover:bg-[#263c66] transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Printer size={20} />
        Imprimir Etiqueta
      </button>
      
      <p className="mt-4 text-xs text-center text-gray-400 max-w-xs">
        *Certifique-se de que a impressora esteja configurada para escala 100% para garantir a leitura do QR.
      </p>
    </div>
  );
};

export default ItemQrLabel;
