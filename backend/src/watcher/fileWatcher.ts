import chokidar from 'chokidar';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import { processFile } from '../ingestion/pipeline';

export function startWatcher(): void {
  const watchFolder = config.watchFolder;

  if (!fs.existsSync(watchFolder)) {
    fs.mkdirSync(watchFolder, { recursive: true });
    console.log(`[Watcher] Created inbox folder: ${watchFolder}`);
  }

  const watcher = chokidar.watch(watchFolder, {
    persistent: true,
    ignoreInitial: false,
    depth: 2,
    awaitWriteFinish: { stabilityThreshold: 2000, pollInterval: 500 },
    ignored: /(^|[/\\])\../,
  });

  watcher.on('add', (filePath: string) => {
    const ext = path.extname(filePath).toLowerCase();
    if (!['.pdf', '.pptx'].includes(ext)) return;

    // inbox/ModuleName/file.pdf → module_name = "ModuleName"
    // inbox/file.pdf             → module_name = null
    const relativePath = path.relative(watchFolder, filePath);
    const parts = relativePath.split(path.sep);
    const moduleName = parts.length > 1 ? parts[0] : null;

    console.log(`[Watcher] New file: ${path.basename(filePath)}${moduleName ? ` [${moduleName}]` : ''}`);
    processFile(filePath, moduleName).catch(console.error);
  });

  watcher.on('error', (err: Error) => {
    console.error('[Watcher] Error:', err);
  });

  console.log(`[Watcher] Watching: ${watchFolder} (subfolders supported)`);
}
