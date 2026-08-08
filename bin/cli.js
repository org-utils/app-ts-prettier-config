#!/usr/bin/env node

import { Command } from 'commander';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

/* -------------------------------------------------------------------------- */
/* Paths                                                                      */
/* -------------------------------------------------------------------------- */

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PACKAGE_ROOT = resolve(__dirname, '..');

const CONFIG_ROOTS = {
  typescript: join(PACKAGE_ROOT, 'tsconfig'),
  prettier: join(PACKAGE_ROOT, 'prettier'),
  eslint: join(PACKAGE_ROOT, 'eslint'),
};

/* -------------------------------------------------------------------------- */
/* Available configuration files                                              */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Dependencies                                                               */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/* Presets                                                                    */
/* -------------------------------------------------------------------------- */

const PRESETS = {
  node: {
    typescript: 'node',
    eslint: 'node',
  },

  library: {
    typescript: 'library',
    eslint: 'library',
  },

  bundler: {
    typescript: 'bundler',
    eslint: 'base',
  },

  strict: {
    eslint: 'strict',
  },

  default: {},
};

/* -------------------------------------------------------------------------- */
/* Logging                                                                    */
/* -------------------------------------------------------------------------- */

function log(message) {
  console.log(`\n${message}`);
}

function success(message) {
  console.log(`✓ ${message}`);
}

function warn(message) {
  console.warn(`⚠ ${message}`);
}

function error(message) {
  console.error(`✗ ${message}`);
}

/* -------------------------------------------------------------------------- */
/* File utilities                                                             */
/* -------------------------------------------------------------------------- */

function ensureDirectory(directory) {
  mkdirSync(directory, {
    recursive: true,
  });
}

function readJsonFile(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function writeJsonFile(file, data) {
  ensureDirectory(dirname(file));

  writeFileSync(
    file,
    `${JSON.stringify(data, null, 2)}\n`,
    'utf8',
  );
}

function copyConfig(source, destination, force = false) {
  if (!existsSync(source)) {
    throw new Error(
      `Configuration file does not exist:\n${source}`,
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

/* -------------------------------------------------------------------------- */
/* package.json                                                               */
/* -------------------------------------------------------------------------- */

function readPackageJson() {
  const packageJsonPath = join(
    process.cwd(),
    'package.json',
  );

  if (!existsSync(packageJsonPath)) {
    throw new Error(
      'package.json was not found. Run this command from the root of your project.',
    );
  }

  return {
    path: packageJsonPath,
    data: readJsonFile(packageJsonPath),
  };
}

/* -------------------------------------------------------------------------- */
/* Package manager detection                                                  */
/* -------------------------------------------------------------------------- */

function detectPackageManager() {
  const cwd = process.cwd();

  /*
   * Prefer the lockfile because it is the most reliable
   * indicator when running inside an existing project.
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
    existsSync(join(cwd, 'bun.lockb')) ||
    existsSync(join(cwd, 'bun.lock'))
  ) {
    return 'bun';
  }

  if (
    existsSync(join(cwd, 'bun.lock')) ||
    existsSync(join(cwd, 'bun.lockb'))
  ) {
    return 'bun';
  }

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

/* -------------------------------------------------------------------------- */
/* Dependency installation                                                    */
/* -------------------------------------------------------------------------- */

function installDependencies(packages) {
  const uniquePackages = [
    ...new Set(packages),
  ];

  if (!uniquePackages.length) {
    return;
  }

  const packageManager =
    detectPackageManager();

  log(
    `Installing dependencies with ${packageManager}:\n${uniquePackages
      .map((dependency) => `  - ${dependency}`)
      .join('\n')}`,
  );

  const {
    command,
    args,
  } = getInstallCommand(
    packageManager,
    uniquePackages,
  );

  const result = spawnSync(
    command,
    args,
    {
      cwd: process.cwd(),
      stdio: 'inherit',
      shell: process.platform === 'win32',
    },
  );

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

/* -------------------------------------------------------------------------- */
/* TypeScript                                                                 */
/* -------------------------------------------------------------------------- */

function getTypeScriptConfigFile(config) {
  const normalized =
    config === 'typescript'
      ? 'base'
      : config;

  const file =
    CONFIG_FILES.typescript[normalized];

  if (!file) {
    throw new Error(
      `Unknown TypeScript configuration "${config}".`,
    );
  }

  return file;
}

function getTypeScriptDestination(config) {
  if (
    config === 'base' ||
    config === 'typescript'
  ) {
    return join(
      process.cwd(),
      'tsconfig.json',
    );
  }

  return join(
    process.cwd(),
    `tsconfig.${config}.json`,
  );
}

function createTypeScriptConfig(
  config,
  force,
) {
  const file =
    getTypeScriptConfigFile(config);

  const source =
    join(
      CONFIG_ROOTS.typescript,
      file,
    );

  const destination =
    getTypeScriptDestination(config);

  return copyConfig(
    source,
    destination,
    force,
  );
}

/* -------------------------------------------------------------------------- */
/* Prettier                                                                   */
/* -------------------------------------------------------------------------- */

function createPrettierConfig(
  sortImports,
  force,
) {
  const baseSource =
    join(
      CONFIG_ROOTS.prettier,
      CONFIG_FILES.prettier.base,
    );

  const destination =
    join(
      process.cwd(),
      'prettier.config.mjs',
    );

  const created =
    copyConfig(
      baseSource,
      destination,
      force,
    );

  /*
   * The sort-imports configuration intentionally
   * imports the base prettier configuration.
   *
   * Therefore both files must be copied when
   * --sort-imports is enabled.
   */

  if (sortImports) {
    const sortSource =
      join(
        CONFIG_ROOTS.prettier,
        CONFIG_FILES.prettier.sortImports,
      );

    const sortDestination =
      join(
        process.cwd(),
        'prettier.sort-imports.config.mjs',
      );

    copyConfig(
      sortSource,
      sortDestination,
      force,
    );
  }

  const ignoreSource =
    join(
      CONFIG_ROOTS.prettier,
      CONFIG_FILES.prettier.ignore,
    );

  const ignoreDestination =
    join(
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

/* -------------------------------------------------------------------------- */
/* ESLint                                                                     */
/* -------------------------------------------------------------------------- */

function getEslintConfigFile(config) {
  const normalized =
    config === 'eslint'
      ? 'base'
      : config;

  const file =
    CONFIG_FILES.eslint[normalized];

  if (!file) {
    throw new Error(
      `Unknown ESLint configuration "${config}".`,
    );
  }

  return file;
}

function createEslintConfig(
  config,
  force,
) {
  const file =
    getEslintConfigFile(config);

  const source =
    join(
      CONFIG_ROOTS.eslint,
      file,
    );

  const destination =
    join(
      process.cwd(),
      'eslint.config.js',
    );

  return copyConfig(
    source,
    destination,
    force,
  );
}

/* -------------------------------------------------------------------------- */
/* Preset handling                                                            */
/* -------------------------------------------------------------------------- */

function getPresetConfig(preset) {
  if (!preset) {
    return PRESETS.default;
  }

  const configuration =
    PRESETS[preset];

  if (!configuration) {
    throw new Error(
      `Unknown preset "${preset}". Available presets: ${Object.keys(
        PRESETS,
      )
        .filter((name) => name !== 'default')
        .join(', ')}`,
    );
  }

  return configuration;
}

/* -------------------------------------------------------------------------- */
/* Dependency collection                                                      */
/* -------------------------------------------------------------------------- */

function collectDependencies({
  typescript = false,
  prettier = false,
  sortImports = false,
  eslint = false,
  eslintPrettier = false,
}) {
  const dependencies =
    new Set();

  if (typescript) {
    for (
      const dependency of
      DEPENDENCIES.typescript
    ) {
      dependencies.add(
        dependency,
      );
    }
  }

  if (prettier) {
    for (
      const dependency of
      DEPENDENCIES.prettier
    ) {
      dependencies.add(
        dependency,
      );
    }
  }

  if (sortImports) {
    for (
      const dependency of
      DEPENDENCIES.prettierSortImports
    ) {
      dependencies.add(
        dependency,
      );
    }
  }

  if (eslint) {
    for (
      const dependency of
      DEPENDENCIES.eslint
    ) {
      dependencies.add(
        dependency,
      );
    }
  }

  if (eslintPrettier) {
    for (
      const dependency of
      DEPENDENCIES.eslintPrettier
    ) {
      dependencies.add(
        dependency,
      );
    }
  }

  return [
    ...dependencies,
  ];
}

/* -------------------------------------------------------------------------- */
/* package.json scripts                                                       */
/* -------------------------------------------------------------------------- */

function updatePackageScripts({
  typescript,
  prettier,
  eslint,
}) {
  const {
    path,
    data,
  } = readPackageJson();

  data.scripts ??= {};

  let changed = false;

  if (
    typescript &&
    !data.scripts.typecheck
  ) {
    data.scripts.typecheck =
      'tsc --noEmit';

    changed = true;
  }

  if (
    prettier &&
    !data.scripts.format
  ) {
    data.scripts.format =
      'prettier --write .';

    changed = true;
  }

  if (
    prettier &&
    !data.scripts['format:check']
  ) {
    data.scripts['format:check'] =
      'prettier --check .';

    changed = true;
  }

  if (
    eslint &&
    !data.scripts.lint
  ) {
    data.scripts.lint =
      'eslint .';

    changed = true;
  }

  if (changed) {
    writeJsonFile(
      path,
      data,
    );

    success(
      'Updated package.json scripts.',
    );
  }
}

/* -------------------------------------------------------------------------- */
/* Initialization                                                             */
/* -------------------------------------------------------------------------- */

function init({
  config,
  all,
  force,
  preset,
  sortImports,
}) {
  const packageConfig =
    getPresetConfig(preset);

  const initializeTypescript =
    all ||
    config === 'typescript' ||
    config === 'tsconfig' ||
    Boolean(
      packageConfig.typescript,
    );

  const initializePrettier =
    all ||
    config === 'prettier';

  const initializeEslint =
    all ||
    config === 'eslint' ||
    Boolean(
      packageConfig.eslint,
    );

  const typescriptPreset =
    packageConfig.typescript ??
    'base';

  const eslintPreset =
    packageConfig.eslint ??
    'base';

  /*
   * If the user explicitly requests
   * a configuration, don't silently
   * initialize unrelated configurations.
   */

  log(
    'Initializing project configuration...',
  );

  if (initializeTypescript) {
    createTypeScriptConfig(
      typescriptPreset,
      force,
    );
  }

  if (initializePrettier) {
    createPrettierConfig(
      sortImports,
      force,
    );
  }

  if (initializeEslint) {
    createEslintConfig(
      eslintPreset,
      force,
    );
  }

  const dependencies =
    collectDependencies({
      typescript:
        initializeTypescript,

      prettier:
        initializePrettier,

      sortImports:
        initializePrettier &&
        sortImports,

      eslint:
        initializeEslint,

      eslintPrettier:
        initializeEslint &&
        initializePrettier,
    });

  installDependencies(
    dependencies,
  );

  updatePackageScripts({
    typescript:
      initializeTypescript,

    prettier:
      initializePrettier,

    eslint:
      initializeEslint,
  });

  log(
    'Configuration initialized successfully.',
  );

  console.log(`
Next steps:

${
  initializeTypescript
    ? '  npm run typecheck'
    : ''
}

${
  initializePrettier
    ? '  npm run format'
    : ''
}

${
  initializeEslint
    ? '  npm run lint'
    : ''
}
`);
}

/* -------------------------------------------------------------------------- */
/* CLI                                                                        */
/* -------------------------------------------------------------------------- */

const program =
  new Command();

program
  .name('ts-config')
  .description(
    'Org Utils TypeScript, ESLint and Prettier configuration CLI',
  )
  .version('0.0.1');

/* -------------------------------------------------------------------------- */
/* init command                                                               */
/* -------------------------------------------------------------------------- */

program
  .command('init')
  .description(
    'Initialize project configuration',
  )
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
    'Configuration preset: node, library, bundler, strict',
  )
  .option(
    '--sort-imports',
    'Enable @trivago/prettier-plugin-sort-imports',
  )
  .action(
    (config, options) => {
      try {
        if (
          !options.all &&
          !config &&
          !options.preset
        ) {
          throw new Error(
            'Specify a configuration, use --preset, or use --all.',
          );
        }

        const normalizedConfig =
          config === 'tsconfig'
            ? 'typescript'
            : config;

        const allowed = [
          undefined,
          'typescript',
          'prettier',
          'eslint',
        ];

        if (
          !allowed.includes(
            normalizedConfig,
          )
        ) {
          throw new Error(
            `Unknown configuration "${config}".`,
          );
        }

        init({
          config:
            normalizedConfig,

          all:
            Boolean(
              options.all,
            ),

          force:
            Boolean(
              options.force,
            ),

          preset:
            options.preset ??
            'default',

          sortImports:
            Boolean(
              options.sortImports,
            ),
        });
      } catch (err) {
        error(
          err instanceof Error
            ? err.message
            : String(err),
        );

        process.exitCode = 1;
      }
    },
  );

/* -------------------------------------------------------------------------- */
/* list command                                                               */
/* -------------------------------------------------------------------------- */

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
  next
  react
  react-library

Prettier:
  base
  sort-imports
  ignore

ESLint:
  base
  node
  library
  strict
  prettier

Presets:

  node
    TypeScript Node + ESLint Node

  library
    TypeScript Library + ESLint Library

  bundler
    TypeScript Bundler + ESLint Base

  strict
    ESLint Strict

Examples:

  npx ts-config init --all

  npx ts-config init typescript

  npx ts-config init typescript --preset node

  npx ts-config init typescript --preset library

  npx ts-config init typescript --preset bundler

  npx ts-config init prettier

  npx ts-config init prettier --sort-imports

  npx ts-config init eslint

  npx ts-config init eslint --preset strict

  npx ts-config init --all --preset node

  npx ts-config init --all --preset library

  npx ts-config init --all --preset bundler

  npx ts-config init --all --force
`);
  });

/* -------------------------------------------------------------------------- */
/* doctor command                                                             */
/* -------------------------------------------------------------------------- */

program
  .command('doctor')
  .description(
    'Check the current project configuration',
  )
  .action(() => {
    try {
      const {
        data,
      } = readPackageJson();

      const cwd =
        process.cwd();

      console.log(`
Project:

name:
  ${data.name ?? 'unknown'}

package manager:
  ${detectPackageManager()}

Configuration:

TypeScript:
  ${
    existsSync(
      join(
        cwd,
        'tsconfig.json',
      ),
    )
      ? '✓'
      : '✗'
  } tsconfig.json

Prettier:
  ${
    existsSync(
      join(
        cwd,
        'prettier.config.mjs',
      ),
    )
      ? '✓'
      : '✗'
  } prettier.config.mjs

  ${
    existsSync(
      join(
        cwd,
        'prettier.sort-imports.config.mjs',
      ),
    )
      ? '✓'
      : '✗'
  } prettier.sort-imports.config.mjs

  ${
    existsSync(
      join(
        cwd,
        '.prettierignore',
      ),
    )
      ? '✓'
      : '✗'
  } .prettierignore

ESLint:
  ${
    existsSync(
      join(
        cwd,
        'eslint.config.js',
      ),
    )
      ? '✓'
      : '✗'
  } eslint.config.js
`);
    } catch (err) {
      error(
        err instanceof Error
          ? err.message
          : String(err),
      );

      process.exitCode = 1;
    }
  });

/* -------------------------------------------------------------------------- */
/* Parse                                                                      */
/* -------------------------------------------------------------------------- */

program.parse();
