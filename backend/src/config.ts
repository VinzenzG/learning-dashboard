import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });

function resolveFromRoot(p: string): string {
  if (path.isAbsolute(p)) return p;
  return path.resolve(__dirname, '../..', p);
}

function findClaudeBinary(): string {
  // Explicit override wins
  if (process.env.CLAUDE_CLI_PATH) return process.env.CLAUDE_CLI_PATH;

  const { execSync } = require('child_process');
  // Try standard PATH
  try {
    const found = execSync('which claude', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    if (found) return found;
  } catch { /* not in PATH */ }

  // Search VSCode extensions (pick most recent)
  const { readdirSync } = require('fs');
  const extDir = `${process.env.HOME}/.vscode/extensions`;
  try {
    const dirs = readdirSync(extDir)
      .filter((d: string) => d.startsWith('anthropic.claude-code-'))
      .sort()
      .reverse();
    for (const d of dirs) {
      const bin = `${extDir}/${d}/resources/native-binary/claude`;
      try {
        execSync(`"${bin}" --version`, { stdio: 'ignore' });
        return bin;
      } catch { /* try next */ }
    }
  } catch { /* no VSCode extensions */ }

  // Mac app
  const macApp = `${process.env.HOME}/Library/Application Support/Claude/claude-code`;
  try {
    const versions = readdirSync(macApp).sort().reverse();
    for (const v of versions) {
      const bin = `${macApp}/${v}/claude.app/Contents/MacOS/claude`;
      if (require('fs').existsSync(bin)) return bin;
    }
  } catch { /* not installed */ }

  return 'claude'; // fall back to PATH lookup at runtime
}

export interface AppConfig {
  aiProvider: 'claude-cli' | 'claude-sdk' | 'ollama';
  anthropicApiKey: string;
  ollamaBaseUrl: string;
  ollamaModel: string;
  watchFolder: string;
  dbPath: string;
  backendPort: number;
  questionsPerChunk: number;
  claudeCliBin: string;
}

export const config: AppConfig = {
  aiProvider: (process.env.AI_PROVIDER as AppConfig['aiProvider']) || 'claude-cli',
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  ollamaModel: process.env.OLLAMA_MODEL || 'llama3.2',
  watchFolder: resolveFromRoot(process.env.WATCH_FOLDER || './inbox'),
  dbPath: resolveFromRoot(process.env.DB_PATH || './data/learning.db'),
  backendPort: parseInt(process.env.BACKEND_PORT || '3001', 10),
  questionsPerChunk: parseInt(process.env.QUESTIONS_PER_CHUNK || '6', 10),
  claudeCliBin: findClaudeBinary(),
};
