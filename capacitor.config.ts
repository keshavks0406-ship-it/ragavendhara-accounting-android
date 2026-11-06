import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'in.raghavendra.co.accounting',
  appName: 'R & Co. Accounting',
  webDir: 'dist',
  android: {
    backgroundColor: '#f8fafc',
    allowMixedContent: false,
  },
  plugins: {
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      androidIsEncryption: false,
      androidBiometric: {
        biometricAuth: false,
        title: 'Unlock Accounting Database',
      },
    },
  },
};

export default config;
