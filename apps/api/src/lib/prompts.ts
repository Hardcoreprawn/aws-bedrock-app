import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config.js';

/**
 * Loads a markdown prompt file by name from the configured prompts directory.
 */
export async function loadPrompt(name: string): Promise<string> {
  const promptPath = path.join(env.PROMPTS_DIR, `${name}.md`);
  return readFile(promptPath, 'utf8');
}
