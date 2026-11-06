import * as XLSX from 'xlsx';
import { exportWorkbookFile } from './nativeActions';

export function formatCurrency(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safe);
}

export function formatNumber(amount: number, decimals = 2): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(safe);
}

export function formatDate(isoDate: string): string {
  if (!isoDate) return '—';
  const parts = isoDate.split('-');
  if (parts.length !== 3) return isoDate;
  const [year, month, day] = parts;
  if (year.length === 4) {
    return `${day}-${month}-${year}`;
  }
  return isoDate;
}

/**
 * Parses a user-typed date string ("DD-MM-YYYY", "DD/MM/YYYY", "DD.MM.YYYY", or "YYYY-MM-DD")
 * into normalized "YYYY-MM-DD" format. Returns null if invalid.
 */
export function parseTypedDateToISO(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  // Match YYYY-MM-DD or YYYY/MM/DD
  const isoMatch = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(trimmed);
  if (isoMatch) {
    const y = parseInt(isoMatch[1], 10);
    const m = parseInt(isoMatch[2], 10);
    const d = parseInt(isoMatch[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  // Match DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const dmyMatch = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(trimmed);
  if (dmyMatch) {
    const d = parseInt(dmyMatch[1], 10);
    const m = parseInt(dmyMatch[2], 10);
    const y = parseInt(dmyMatch[3], 10);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
  }

  return null;
}

export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const TENS = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

function twoDigitsToWords(n: number): string {
  if (n === 0) return '';
  if (n < 20) return ONES[n];
  const ten = Math.floor(n / 10);
  const rem = n % 10;
  return `${TENS[ten]}${rem ? ' ' + ONES[rem] : ''}`;
}

function integerToIndianWords(num: number): string {
  if (num === 0) return 'Zero';
  let n = Math.floor(Math.abs(num));
  const parts: string[] = [];

  const crore = Math.floor(n / 10000000);
  n %= 10000000;
  if (crore > 0) {
    parts.push(`${integerToIndianWords(crore)} Crore`);
  }

  const lakh = Math.floor(n / 100000);
  n %= 100000;
  if (lakh > 0) {
    parts.push(`${twoDigitsToWords(lakh)} Lakh`);
  }

  const thousand = Math.floor(n / 1000);
  n %= 1000;
  if (thousand > 0) {
    parts.push(`${twoDigitsToWords(thousand)} Thousand`);
  }

  const hundred = Math.floor(n / 100);
  n %= 100;
  if (hundred > 0) {
    parts.push(`${ONES[hundred]} Hundred`);
  }

  if (n > 0) {
    if (parts.length > 0) {
      parts.push(`and ${twoDigitsToWords(n)}`);
    } else {
      parts.push(twoDigitsToWords(n));
    }
  }

  return parts.join(' ');
}

export function amountToIndianWords(amount: number): string {
  const rounded = Math.round((Math.abs(amount) + Number.EPSILON) * 100) / 100;
  const rupees = Math.floor(rounded);
  const paise = Math.round((rounded - rupees) * 100);

  let result = `Rupees ${integerToIndianWords(rupees)}`;
  if (paise > 0) {
    result += ` and ${twoDigitsToWords(paise)} Paise`;
  }
  return `${result} Only`;
}

export function exportToExcel(
  filename: string,
  headers: string[],
  rows: (string | number | null | undefined)[][],
  sheetName: string = 'Sheet1'
): void {
  const data = [headers, ...rows];
  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Auto-size columns based on maximum content length
  const colWidths = headers.map((h, i) => {
    let maxLen = String(h ?? '').length;
    for (const row of rows) {
      const cellLen = String(row[i] ?? '').length;
      if (cellLen > maxLen) maxLen = cellLen;
    }
    return { wch: Math.min(Math.max(maxLen + 3, 10), 50) };
  });
  worksheet['!cols'] = colWidths;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));

  const finalFilename = filename.endsWith('.xlsx')
    ? filename
    : filename.replace(/\.[^/.]+$/, '') + '.xlsx';

  void exportWorkbookFile(workbook, finalFilename);
}

// Deprecated alias for backwards-compatibility
export const exportToCsv = exportToExcel;
