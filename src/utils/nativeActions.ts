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

/** Open the Android native print dialog for the current report or bill. */
export async function printCurrentPage(jobName = 'Accounting report'): Promise<void> {
  try {
    if (Capacitor.isNativePlatform()) {
      await Printer.printWebView({ name: jobName });
    } else {
      window.print();
    }
  } catch (error) {
    console.error('Printing failed:', error);
    alert('Could not open the print dialog. Please try again. ' + (error instanceof Error ? error.message : ''));
  }
}
