#!/usr/bin/env node

import { Command } from 'commander';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = resolve(__dirname, '..');

const CONFIG_ROOTS = {
  typescript: join(PACKAGE_ROOT, 'tsconfig'),
  prettier: join(PACKAGE_ROOT, 'prettier'),
  eslint: join(PACKAGE_ROOT, 'eslint'),
};

const CONFIG_FILES = {
  typescript: {
    base: 'tsconfig.base.json',
    node: 'tsconfig.node.json',
    library: 'tsconfig.library.json',
    bundler: 'tsconfig.bundler.json',
    next: 'tsconfig.next.json',
    react: 'tsconfig.react.json',
    'react-library': 'tsconfig.react-library.json',
  },

  prettier: {
    base: 'prettier.config.mjs',
    sortImports: 'prettier.sort-imports.config.mjs',
    ignore: '.prettierignore',
  },

  eslint: {
    base: 'base.js',
    node: 'node.js',
    library: 'library.js',
    strict: 'strict.js',
    prettier: 'prettier.js',
  },
};

const DEPENDENCIES = {
  typescript: ['typescript'],

  prettier: ['prettier'],

  prettierSortImports: [
    '@trivago/prettier-plugin-sort-imports',
  ],

  eslint: [
    'eslint',
    '@eslint/js',
    'typescript-eslint',
  ],

  eslintPrettier: [
    'eslint-config-prettier',
  ],
};

const PRESETS = {
  node: {
    typescript: 'node',
    eslint: 'node',
  },
  bundler: {
    typescript: 'bundler',
    eslint: 'node',
  },

  library: {
    typescript: 'library',
    eslint: 'library',
  },

  strict: {
    eslint: 'strict',
  },
};

const VALID_CONFIGS = [
  'typescript',
  'prettier',
  'eslint',
];

const VALID_PRESETS = Object.keys(PRESETS);

function log(message) {
  console.log(`\n${message}`);
}

function success(message) {
  console.log(`✓ ${message}`);
}

function warn(message) {
  console.warn(`⚠ ${message}`);
}

function fail(message) {
  console.error(`✗ ${message}`);
}

function ensureDirectory(directory) {
  mkdirSync(directory, {
    recursive: true,
  });
}

function readPackageJson() {
  const packageJsonPath = join(process.cwd(), 'package.json');

  if (!existsSync(packageJsonPath)) {
    throw new Error(
      'package.json was not found. Run this command from the root of your project.',
    );
  }

  try {
    return {
      path: packageJsonPath,
      data: JSON.parse(
        readFileSync(packageJsonPath, 'utf8'),
      ),
    };
  } catch {
    throw new Error('Unable to parse package.json.');
  }
}

function detectPackageManager() {
  const cwd = process.cwd();

  /*
   * Lockfile is the most reliable signal.
   */
  if (existsSync(join(cwd, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }

  if (
    existsSync(join(cwd, 'yarn.lock')) ||
    existsSync(join(cwd, '.yarn'))
  ) {
    return 'yarn';
  }

  if (
    existsSync(join(cwd, 'bun.lock')) ||
    existsSync(join(cwd, 'bun.lockb'))
  ) {
    return 'bun';
  }

  /*
   * Fall back to the npm user agent.
   */
  const userAgent =
    process.env.npm_config_user_agent ?? '';

  if (userAgent.startsWith('pnpm')) {
    return 'pnpm';
  }

  if (userAgent.startsWith('yarn')) {
    return 'yarn';
  }

  if (userAgent.startsWith('bun')) {
    return 'bun';
  }

  return 'npm';
}

function getInstallCommand(packageManager, packages) {
  switch (packageManager) {
    case 'pnpm':
      return {
        command: 'pnpm',
        args: ['add', '-D', ...packages],
      };

    case 'yarn':
      return {
        command: 'yarn',
        args: ['add', '--dev', ...packages],
      };

    case 'bun':
      return {
        command: 'bun',
        args: ['add', '--dev', ...packages],
      };

    case 'npm':
    default:
      return {
        command: 'npm',
        args: ['install', '--save-dev', ...packages],
      };
  }
}

function installDependencies(packages, options = {}) {
  if (!packages.length) {
    return;
  }

  if (options.noInstall) {
    warn(
      `Skipping dependency installation: ${packages.join(', ')}`,
    );

    return;
  }

  const packageManager = detectPackageManager();

  log(
    `Installing dependencies with ${packageManager}: ${packages.join(', ')}`,
  );

  if (options.dryRun) {
    const { command, args } =
      getInstallCommand(packageManager, packages);

    console.log(`${command} ${args.join(' ')}`);

    return;
  }

  const { command, args } =
    getInstallCommand(packageManager, packages);

  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `${packageManager} failed while installing dependencies.`,
    );
  }

  success('Dependencies installed.');
}

function copyConfig(source, destination, force = false) {
  if (!existsSync(source)) {
    throw new Error(
      `Configuration file does not exist: ${source}`,
    );
  }

  if (existsSync(destination) && !force) {
    warn(
      `Skipped ${destination} because it already exists. Use --force to overwrite.`,
    );

    return false;
  }

  ensureDirectory(dirname(destination));

  copyFileSync(source, destination);

  success(`Created ${destination}`);

  return true;
}

function getTypescriptDestination(config) {
  if (config === 'base') {
    return join(process.cwd(), 'tsconfig.json');
  }

  return join(
    process.cwd(),
    `tsconfig.${config}.json`,
  );
}

function createTypescriptConfig(config, force) {
  if (!CONFIG_FILES.typescript[config]) {
    throw new Error(
      `Unknown TypeScript configuration "${config}".`,
    );
  }

  const source = join(
    CONFIG_ROOTS.typescript,
    CONFIG_FILES.typescript[config],
  );

  const destination = getTypescriptDestination(config);

  return copyConfig(
    source,
    destination,
    force,
  );
}

function createPrettierConfig(options) {
  const {
    sortImports,
    force,
  } = options;

  /*
   * Always install the base prettier config.
   */
  const source = join(
    CONFIG_ROOTS.prettier,
    CONFIG_FILES.prettier.base,
  );

  const destination = join(
    process.cwd(),
    'prettier.config.mjs',
  );

  const created = copyConfig(
    source,
    destination,
    force,
  );

  /*
   * Import sorting is an optional separate configuration.
   *
   * This file can be imported/extended by the user's
   * prettier config instead of replacing the base config.
   */
  if (sortImports) {
    const sortImportsSource = join(
      CONFIG_ROOTS.prettier,
      CONFIG_FILES.prettier.sortImports,
    );

    const sortImportsDestination = join(
      process.cwd(),
      'prettier.sort-imports.config.mjs',
    );

    copyConfig(
      sortImportsSource,
      sortImportsDestination,
      force,
    );
  }

  const ignoreSource = join(
    CONFIG_ROOTS.prettier,
    CONFIG_FILES.prettier.ignore,
  );

  const ignoreDestination = join(
    process.cwd(),
    '.prettierignore',
  );

  copyConfig(
    ignoreSource,
    ignoreDestination,
    force,
  );

  return created;
}

function createEslintConfig(config, force) {
  if (!CONFIG_FILES.eslint[config]) {
    throw new Error(
      `Unknown ESLint configuration "${config}".`,
    );
  }

  const source = join(
    CONFIG_ROOTS.eslint,
    CONFIG_FILES.eslint[config],
  );

  const destination = join(
    process.cwd(),
    'eslint.config.js',
  );

  return copyConfig(
    source,
    destination,
    force,
  );
}

function collectDependencies(options) {
  const dependencies = new Set();

  if (options.typescript) {
    for (const dependency of DEPENDENCIES.typescript) {
      dependencies.add(dependency);
    }
  }

  if (options.prettier) {
    for (const dependency of DEPENDENCIES.prettier) {
      dependencies.add(dependency);
    }
  }

  if (options.sortImports) {
    for (const dependency of DEPENDENCIES.prettierSortImports) {
      dependencies.add(dependency);
    }
  }

  if (options.eslint) {
    for (const dependency of DEPENDENCIES.eslint) {
      dependencies.add(dependency);
    }
  }

  if (options.eslintPrettier) {
    for (const dependency of DEPENDENCIES.eslintPrettier) {
      dependencies.add(dependency);
    }
  }

  return [...dependencies];
}

function updatePackageScripts(options = {}) {
  const {
    typescript,
    prettier,
    eslint,
    dryRun = false,
  } = options;

  const { path, data } = readPackageJson();

  data.scripts ??= {};

  const scripts = {};

  if (typescript) {
    scripts.typecheck = 'tsc --noEmit';
  }

  if (prettier) {
    scripts.format = 'prettier --write .';
    scripts['format:check'] = 'prettier --check .';
  }

  if (eslint) {
    scripts.lint = 'eslint .';
  }

  let changed = false;

  for (const [name, command] of Object.entries(scripts)) {
    if (!data.scripts[name]) {
      data.scripts[name] = command;
      changed = true;
    }
  }

  if (!changed) {
    return;
  }

  if (dryRun) {
    success('Would update package.json scripts.');

    return;
  }

  writeFileSync(
    path,
    `${JSON.stringify(data, null, 2)}\n`,
  );

  success('Updated package.json scripts.');
}

function resolvePreset(preset) {
  if (!preset || preset === 'default') {
    return {};
  }

  if (!PRESETS[preset]) {
    throw new Error(
      `Unknown preset "${preset}". Available presets: ${VALID_PRESETS.join(', ')}`,
    );
  }

  return PRESETS[preset];
}

function resolveConfiguration({
  config,
  preset,
  all,
}) {
  const presetConfig = resolvePreset(preset);

  const initializeAll = Boolean(all);

  return {
    typescript:
      initializeAll ||
      config === 'typescript' ||
      Boolean(presetConfig.typescript),

    prettier:
      initializeAll ||
      config === 'prettier',

    eslint:
      initializeAll ||
      config === 'eslint' ||
      Boolean(presetConfig.eslint),

    typescriptPreset:
      presetConfig.typescript ?? 'base',

    eslintPreset:
      presetConfig.eslint ?? 'base',
  };
}

function init(options) {
  const {
    config,
    preset,
    all,
    force,
    sortImports,
    dryRun,
    noInstall,
  } = options;

  const resolved = resolveConfiguration({
    config,
    preset,
    all,
  });

  log('Initializing project configuration...');

  if (resolved.typescript) {
    createTypescriptConfig(
      resolved.typescriptPreset,
      force,
    );
  }

  if (resolved.prettier) {
    createPrettierConfig({
      sortImports,
      force,
    });
  }

  if (resolved.eslint) {
    createEslintConfig(
      resolved.eslintPreset,
      force,
    );
  }

  const dependencies = collectDependencies({
    typescript: resolved.typescript,
    prettier: resolved.prettier,
    sortImports:
      resolved.prettier && sortImports,
    eslint: resolved.eslint,
    eslintPrettier:
      resolved.eslint &&
      resolved.prettier,
  });

  installDependencies(
    dependencies,
    {
      dryRun,
      noInstall,
    },
  );

  updatePackageScripts({
    typescript: resolved.typescript,
    prettier: resolved.prettier,
    eslint: resolved.eslint,
    dryRun,
  });

  log(
    dryRun
      ? 'Dry run completed.'
      : 'Configuration initialized successfully.',
  );
}

function doctor() {
  const { data } = readPackageJson();

  const checks = [
    [
      'TypeScript',
      'tsconfig.json',
    ],
    [
      'Prettier',
      'prettier.config.mjs',
    ],
    [
      'Prettier ignore',
      '.prettierignore',
    ],
    [
      'ESLint',
      'eslint.config.js',
    ],
  ];

  console.log(`
Project:

name: ${data.name ?? 'unknown'}
package manager: ${detectPackageManager()}

Configuration:
`);

  for (const [name, file] of checks) {
    const exists = existsSync(
      join(process.cwd(), file),
    );

    console.log(
      `${exists ? '✓' : '✗'} ${name}: ${file}`,
    );
  }
}

const program = new Command();

program
  .name('ts-config')
  .description(
    'Org Utils TypeScript, ESLint and Prettier configuration CLI',
  )
  .version('0.0.1');

program
  .command('init')
  .description('Initialize project configuration')
  .argument(
    '[config]',
    'typescript, prettier, or eslint',
  )
  .option(
    '--all',
    'Initialize TypeScript, Prettier and ESLint',
  )
  .option(
    '--force',
    'Overwrite existing configuration files',
  )
  .option(
    '--preset <preset>',
    'Configuration preset: node, bundler, library, strict',
  )
  .option(
    '--sort-imports',
    'Enable Prettier import sorting configuration',
  )
  .option(
    '--no-install',
    'Do not install dependencies',
  )
  .option(
    '--dry-run',
    'Show what would happen without changing the project',
  )
  .action((config, options) => {
    try {
      const normalizedConfig =
        config === 'tsconfig'
          ? 'typescript'
          : config;

      if (
        normalizedConfig &&
        !VALID_CONFIGS.includes(normalizedConfig)
      ) {
        throw new Error(
          `Unknown configuration "${config}".`,
        );
      }

      if (
        !options.all &&
        !normalizedConfig &&
        !options.preset
      ) {
        throw new Error(
          'Specify a configuration, --preset, or --all.',
        );
      }

      init({
        config: normalizedConfig,
        all: Boolean(options.all),
        force: Boolean(options.force),
        preset: options.preset ?? 'default',
        sortImports: Boolean(options.sortImports),
        noInstall: Boolean(options.install === false),
        dryRun: Boolean(options.dryRun),
      });
    } catch (err) {
      fail(
        err instanceof Error
          ? err.message
          : String(err),
      );

      process.exitCode = 1;
    }
  });

program
  .command('list')
  .description(
    'List available configurations and presets',
  )
  .action(() => {
    console.log(`
Configurations:

TypeScript:
  base
  node
  library
  bundler
  react
  react-library
  next

Prettier:
  base
  sort-imports

ESLint:
  base
  node
  library
  strict
  prettier

Presets:
  node
  library
  strict

Examples:

  npx ts-config init --all

  npx ts-config init typescript

  npx ts-config init typescript --preset bundler

  npx ts-config init prettier

  npx ts-config init prettier --sort-imports

  npx ts-config init eslint

  npx ts-config init --all --preset node

  npx ts-config init --all --preset library

  npx ts-config init eslint --preset strict

  npx ts-config init --all --force

  npx ts-config init --all --dry-run
`);
  });

program
  .command('doctor')
  .description(
    'Check the current project configuration',
  )
  .action(() => {
    try {
      doctor();
    } catch (err) {
      fail(
        err instanceof Error
          ? err.message
          : String(err),
      );

      process.exitCode = 1;
    }
  });

program.parse();
