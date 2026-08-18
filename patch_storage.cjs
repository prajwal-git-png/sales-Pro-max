const fs = require('fs');
let content = fs.readFileSync('services/storageService.ts', 'utf8');

content = content.replace(
  "export const importFullBackup = async (jsonString: string): Promise<{ success: boolean; message: string }> => {",
  `export interface BackupPackage {
  app: string;
  version: string;
  timestamp: string;
  data: any;
}
export const importFullBackup = async (_jsonString: string): Promise<{ success: boolean; message: string }> => {`
);

fs.writeFileSync('services/storageService.ts', content);
