import os from 'node:os';
import { spawnSync } from 'node:child_process';

const checks = [
  { name: 'node', command: 'node', args: ['--version'], required: true },
  { name: 'npm', command: 'npm', args: ['--version'], required: true },
  { name: 'docker', command: 'docker', args: ['--version'], required: true },
  { name: 'docker compose', command: 'docker', args: ['compose', 'version'], required: true },
  { name: 'terraform', command: 'terraform', args: ['version'], required: false },
  { name: 'aws', command: 'aws', args: ['--version'], required: false },
  { name: 'az', command: 'az', args: ['version'], required: false }
];

const results = checks.map(runCheck);
const failedRequired = results.filter((result) => result.required && !result.ok);

console.log(`Platform: ${os.platform()} ${os.release()}`);

if (os.platform() === 'win32') {
  const wslResult = runCheck({ name: 'wsl', command: 'wsl', args: ['--status'], required: false });
  printResult(wslResult);
  console.log('Recommendation: use Docker Desktop with the WSL 2 engine and store the repo in the WSL filesystem when practical.');
}

for (const result of results) {
  printResult(result);
}

if (failedRequired.length > 0) {
  console.error('One or more required tools are missing. Install the missing tools before continuing.');
  process.exit(1);
}

console.log('Required prerequisites look available.');

function runCheck(check) {
  const output = spawnSync(check.command, check.args, {
    encoding: 'utf8',
    shell: os.platform() === 'win32'
  });

  return {
    ...check,
    ok: output.status === 0,
    details: output.status === 0
      ? (output.stdout || output.stderr).trim()
      : (output.stderr || output.stdout || 'Command not available').trim()
  };
}

function printResult(result) {
  const state = result.ok ? 'OK' : result.required ? 'MISSING' : 'OPTIONAL';
  console.log(`[${state}] ${result.name}: ${result.details}`);
}
