
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { ImportRow } from '../types';

// Expected headers normalized
const HEADERS_MAP: Record<string, string> = {
  'NOME_DO_PRODUTO': 'name',
  'CATEGORIA': 'category',
  'UNIDADE': 'unit',
  'QUANTIDADE_MINIMA': 'minQty',
  'QUANTIDADE_MAXIMA': 'maxQty',
  'ESTOQUE_ID': 'stockId',
  'CAMINHO': 'locationPath',
  'QTD_INICIAL': 'initialQty'
};

const REQUIRED_FIELDS = ['name', 'category', 'unit', 'minQty', 'maxQty'];

export const parseFile = async (file: File): Promise<ImportRow[]> => {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  if (extension === 'csv') {
    return parseCSV(file);
  } else if (['xls', 'xlsx'].includes(extension || '')) {
    return parseExcel(file);
  } else {
    throw new Error('Formato não suportado. Use CSV ou XLSX.');
  }
};

const validateRow = (row: any, index: number): ImportRow => {
  const importRow: ImportRow = {
    rowId: index,
    name: row.name || '',
    category: row.category || '',
    unit: row.unit || '',
    minQty: Number(row.minQty) || 0,
    maxQty: Number(row.maxQty) || 0,
    stockId: row.stockId,
    locationPath: row.locationPath,
    initialQty: row.initialQty ? Number(row.initialQty) : undefined,
    status: 'OK'
  };

  // 1. Check Required
  const missing = REQUIRED_FIELDS.filter(f => !importRow[f as keyof ImportRow]);
  if (missing.length > 0) {
    importRow.status = 'ERROR';
    importRow.message = `Faltando campos: ${missing.join(', ')}`;
    return importRow;
  }

  // 2. Numeric Checks
  if (isNaN(importRow.minQty) || isNaN(importRow.maxQty)) {
    importRow.status = 'ERROR';
    importRow.message = 'Valores numéricos inválidos em Min/Max';
    return importRow;
  }

  if (importRow.minQty > importRow.maxQty) {
    importRow.status = 'ERROR';
    importRow.message = 'Mínimo não pode ser maior que o Máximo';
    return importRow;
  }

  if (importRow.initialQty !== undefined && isNaN(importRow.initialQty)) {
    importRow.status = 'ERROR';
    importRow.message = 'Quantidade inicial inválida';
    return importRow;
  }

  // 3. Normalization logic happens here or in backend
  // Just trim for now
  importRow.name = importRow.name.trim();
  
  return importRow;
};

const mapHeaders = (rawRow: any) => {
  const newRow: any = {};
  Object.keys(rawRow).forEach(key => {
    const normKey = key.trim().toUpperCase().replace(/\s+/g, '_');
    if (HEADERS_MAP[normKey]) {
      newRow[HEADERS_MAP[normKey]] = rawRow[key];
    }
  });
  return newRow;
};

const parseCSV = (file: File): Promise<ImportRow[]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data.map((r: any, idx) => validateRow(mapHeaders(r), idx + 1));
        resolve(rows);
      },
      error: (err) => reject(err)
    });
  });
};

const parseExcel = (file: File): Promise<ImportRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        const rows = jsonData.map((r: any, idx) => validateRow(mapHeaders(r), idx + 1));
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
};
