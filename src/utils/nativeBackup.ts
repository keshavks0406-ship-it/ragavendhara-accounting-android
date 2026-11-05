import { Capacitor } from '@capacitor/core';
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export async function shareBackupFile(filename: string, contents: string): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  const saved = await Filesystem.writeFile({
    path: filename,
    data: contents,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  });
  await Share.share({
    title: 'Raghavendra & Co. Accounting backup',
    text: 'Keep this backup safely. It can be restored on another device.',
    url: saved.uri,
    dialogTitle: 'Save or share accounting backup',
  });
  return true;
}
