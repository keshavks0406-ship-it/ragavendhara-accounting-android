import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Printer } from '@capgo/capacitor-printer';
import * as XLSX from 'xlsx';

/** Save an XLSX workbook and open Android's native share/save sheet. */
export async function exportWorkbookFile(workbook: XLSX.WorkBook, filename: string): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      const base64 = XLSX.write(workbook, { bookType: 'xlsx', type: 'base64' });
      const saved = await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Cache,
      });
      await Share.share({
        title: filename,
        text: 'Save or share this Excel accounting report.',
        url: saved.uri,
        dialogTitle: 'Save or share Excel file',
      });
    } else {
      XLSX.writeFile(workbook, filename);
    }
  } catch (error) {
    console.error('Excel export failed:', error);
    alert('Could not export the Excel file. Please try again. ' + (error instanceof Error ? error.message : ''));
  }
}

/** Open the native print dialog with a report orientation and a meaningful PDF filename. */
export async function printCurrentPage(
  jobName = 'Accounting report',
  orientation: 'portrait' | 'landscape' = 'landscape'
): Promise<void> {
  const previousTitle = document.title;
  const style = document.createElement('style');
  style.id = 'accounting-print-page-settings';
  style.textContent = `@media print { @page { size: ${orientation === 'portrait' ? '210mm 297mm' : '297mm 210mm'} !important; margin: 0 !important; } }`;
  document.head.appendChild(style);
  document.body.classList.toggle('print-portrait', orientation === 'portrait');

  // Remove decimal fractions from report printouts only; preserve the sales bill values.
  const originalText: Array<{ node: Text; value: string }> = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let textNode: Node | null;
  while ((textNode = walker.nextNode())) {
    const parent = textNode.parentElement;
    if (!parent || parent.closest('.a4-sheet-container') || parent.closest('.no-print')) continue;
    const value = textNode.nodeValue || '';
    const wholeNumberValue = value.replace(/(?<![\d.])(\d[\d,]*)\.(\d+)(?![\d.])/g, '$1');
    if (wholeNumberValue !== value) {
      originalText.push({ node: textNode as Text, value });
      textNode.nodeValue = wholeNumberValue;
    }
  }
  document.title = jobName;

  const restore = () => {
    document.getElementById('accounting-print-page-settings')?.remove();
    document.body.classList.remove('print-portrait');
    originalText.forEach(({ node, value }) => { node.nodeValue = value; });
    document.title = previousTitle;
    window.removeEventListener('afterprint', restore);
  };

  try {
    if (Capacitor.isNativePlatform()) {
      await Printer.printWebView({ name: jobName });
      restore();
    } else {
      window.addEventListener('afterprint', restore, { once: true });
      window.print();
      window.setTimeout(restore, 1000);
    }
  } catch (error) {
    restore();
    console.error('Printing failed:', error);
    alert('Could not open the print dialog. Please try again. ' + (error instanceof Error ? error.message : ''));
  }
}
