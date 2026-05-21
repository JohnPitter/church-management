const { spawnSync } = require('node:child_process');
const { mkdirSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const packageJson = require('../package.json');

const getCommandOutput = (command, args) => {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : '';
};

const gitSha = getCommandOutput('git', ['rev-parse', '--short=12', 'HEAD']) || 'unknown';
const buildTime = new Date().toISOString();
const buildVersion = `${packageJson.version}+${gitSha}`;
const buildMetadata = {
  version: packageJson.version,
  buildVersion,
  gitSha,
  buildTime
};

const cracoBin = require.resolve('@craco/craco/dist/bin/craco');
const existingNodeOptions = process.env.NODE_OPTIONS || '';
const nodeOptions = `${existingNodeOptions} --no-warnings`.trim();

const result = spawnSync(process.execPath, [cracoBin, 'build'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_OPTIONS: nodeOptions,
    REACT_APP_VERSION: packageJson.version,
    REACT_APP_BUILD_VERSION: buildVersion,
    REACT_APP_BUILD_SHA: gitSha,
    REACT_APP_BUILD_TIME: buildTime,
  },
});

if (result.status === 0) {
  mkdirSync(join(__dirname, '..', 'build'), { recursive: true });
  writeFileSync(
    join(__dirname, '..', 'build', 'build-version.json'),
    `${JSON.stringify(buildMetadata, null, 2)}\n`
  );
}

process.exit(result.status ?? 1);
