import { readdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const root = new URL('../', import.meta.url);
for (const directory of ['api', 'lib', 'public', 'scripts', 'tests', 'docs']) {
  const files = await readdir(new URL(`${directory}/`, root), { recursive: true });
  for (const file of files.filter((file) => /\.(mjs|js)$/.test(file))) {
    execFileSync(process.execPath, ['--check', `${directory}/${file}`], {
      cwd: root,
      stdio: 'inherit',
    });
  }
}
console.info('JavaScript syntax checks passed.');
