const { spawnSync } = require('node:child_process');

const cracoBin = require.resolve('@craco/craco/dist/bin/craco');
const existingNodeOptions = process.env.NODE_OPTIONS || '';
const nodeOptions = `${existingNodeOptions} --no-warnings`.trim();

const result = spawnSync(process.execPath, [cracoBin, 'build'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: nodeOptions,
  },
});

process.exit(result.status ?? 1);
