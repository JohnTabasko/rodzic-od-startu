import fs from 'node:fs';
import path from 'node:path';

/** Runtime files stay beside the backend, regardless of the process cwd. */
export function runtimeFile(name: string): string {
  const directory = process.env.DATA_DIR?.trim() || path.resolve(__dirname, '..', '..');
  fs.mkdirSync(directory, { recursive: true });
  return path.join(directory, name);
}
