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
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';
import { parse } from 'jsonc-parser';

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
/* Configuration files                                                        */
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

function readJsoncFile(file) {
  const source = readFileSync(file, 'utf8');

  const errors = [];

  const result = parse(source, errors, {
    allowTrailingComma: true,
    disallowComments: false,
  });

  if (errors.length > 0) {
    const firstError = errors[0];

    throw new Error(
      `Invalid JSON/JSONC configuration:\n${file}\n` +
        `Error code: ${firstError.error}\n` +
        `Offset: ${firstError.offset}`,
    );
  }

  return result;
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
      `Skipped ${destination} because it already exists. ` +
        `Use --force to overwrite.`,
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
    data: JSON.parse(
      readFileSync(packageJsonPath, 'utf8'),
    ),
  };
}

/* -------------------------------------------------------------------------- */
/* Package manager                                                            */
/* -------------------------------------------------------------------------- */

function detectPackageManager() {
  const cwd = process.cwd();

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
    `Installing dependencies with ${packageManager}:\n` +
      uniquePackages
        .map(
          (dependency) => `  - ${dependency}`,
        )
        .join('\n'),
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
/* Deep merge                                                                 */
/* -------------------------------------------------------------------------- */

function isPlainObject(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}

function deepMerge(base, override) {
  if (
    !isPlainObject(base) ||
    !isPlainObject(override)
  ) {
    return override;
  }

  const result = {
    ...base,
  };

  for (const [
    key,
    value,
  ] of Object.entries(override)) {
    const existing = result[key];

    if (
      isPlainObject(existing) &&
      isPlainObject(value)
    ) {
      result[key] = deepMerge(
        existing,
        value,
      );
    } else {
      result[key] = value;
    }
  }

  return result;
}

/* -------------------------------------------------------------------------- */
/* TypeScript extends resolver                                                */
/* -------------------------------------------------------------------------- */

/**
 * Resolve a TypeScript configuration and inline all local `extends`.
 *
 * Example:
 *
 * tsconfig.library.json
 *        ↓
 * tsconfig.bundler.json
 *        ↓
 * tsconfig.base.json
 *
 * The generated project config contains the final merged result
 * and no longer depends on files inside this package.
 */
function resolveTypeScriptConfig(
  configFile,
  visited = new Set(),
) {
  const absoluteConfig =
    resolve(configFile);

  if (visited.has(absoluteConfig)) {
    throw new Error(
      `Circular TypeScript configuration inheritance detected:\n${absoluteConfig}`,
    );
  }

  visited.add(absoluteConfig);

  const config =
    readJsoncFile(absoluteConfig);

  const extendsValue =
    config.extends;

  delete config.extends;

  if (!extendsValue) {
    visited.delete(absoluteConfig);

    return config;
  }

  const configDirectory =
    dirname(absoluteConfig);

  const parentConfig =
    resolveTypeScriptExtends(
      extendsValue,
      configDirectory,
    );

  const resolved =
    deepMerge(
      parentConfig,
      config,
    );

  visited.delete(absoluteConfig);

  return resolved;
}

function resolveTypeScriptExtends(
  extendsValue,
  configDirectory,
) {
  let target = extendsValue;

  /*
   * TypeScript permits:
   *
   * "./tsconfig.base.json"
   * "./tsconfig.base"
   *
   * package names
   *
   * For this CLI we primarily resolve local
   * configurations from the config package.
   */

  if (
    target.startsWith('.') ||
    target.startsWith('/')
  ) {
    let file = resolve(
      configDirectory,
      target,
    );

    if (!extname(file)) {
      file += '.json';
    }

    if (!existsSync(file)) {
      throw new Error(
        `Cannot resolve TypeScript extends:\n${extendsValue}\n` +
          `From: ${configDirectory}`,
      );
    }

    return resolveTypeScriptConfig(
      file,
    );
  }

  /*
   * Package-based extends.
   *
   * Resolve relative to this CLI package first.
   */
  try {
    const packageConfig =
      resolve(
        PACKAGE_ROOT,
        'tsconfig',
        target,
      );

    if (existsSync(packageConfig)) {
      return resolveTypeScriptConfig(
        packageConfig,
      );
    }

    const jsonConfig =
      `${packageConfig}.json`;

    if (existsSync(jsonConfig)) {
      return resolveTypeScriptConfig(
        jsonConfig,
      );
    }
  } catch {
    // Continue to the useful error below.
  }

  throw new Error(
    `Cannot resolve TypeScript extends "${extendsValue}".`,
  );
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
    CONFIG_FILES.typescript[
      normalized
    ];

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

  if (!existsSync(source)) {
    throw new Error(
      `TypeScript configuration does not exist:\n${source}`,
    );
  }

  /*
   * IMPORTANT:
   *
   * Do not copy the original file.
   *
   * Resolve all `extends` first so the generated
   * tsconfig works independently after the package
   * is no longer installed.
   */
  const resolvedConfig =
    resolveTypeScriptConfig(
      source,
    );

  const destination =
    getTypeScriptDestination(config);

  if (
    existsSync(destination) &&
    !force
  ) {
    warn(
      `Skipped ${destination} because it already exists. ` +
        `Use --force to overwrite.`,
    );

    return false;
  }

  writeJsonFile(
    destination,
    resolvedConfig,
  );

  success(
    `Created ${destination} with resolved configuration.`,
  );

  return true;
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

  const baseDestination =
    join(
      process.cwd(),
      'prettier.config.mjs',
    );

  const created =
    copyConfig(
      baseSource,
      baseDestination,
      force,
    );

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

function createEslintConfig(
  config,
  force,
) {
  const normalized =
    config === 'eslint'
      ? 'base'
      : config;

  const file =
    CONFIG_FILES.eslint[
      normalized
    ];

  if (!file) {
    throw new Error(
      `Unknown ESLint configuration "${config}".`,
    );
  }

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
/* Presets                                                                    */
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
        .filter(
          (name) => name !== 'default',
        )
        .join(', ')}`,
    );
  }

  return configuration;
}

/* -------------------------------------------------------------------------- */
/* Dependencies                                                               */
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

  const nextSteps = [];

  if (initializeTypescript) {
    nextSteps.push(
      'npm run typecheck',
    );
  }

  if (initializePrettier) {
    nextSteps.push(
      'npm run format',
    );
  }

  if (initializeEslint) {
    nextSteps.push(
      'npm run lint',
    );
  }

  if (nextSteps.length) {
    console.log(
      `\nNext steps:\n\n${nextSteps
        .map(
          (step) => `  ${step}`,
        )
        .join('\n')}`,
    );
  }
}

/* -------------------------------------------------------------------------- */
/* CLI                                                                        */
/* -------------------------------------------------------------------------- */

const program =
  new Command();

program
  .name('ts-prettier-config')
  .description(
    'Org Utils TypeScript, ESLint and Prettier configuration CLI',
  )
  .version('0.0.1');

/* -------------------------------------------------------------------------- */
/* init                                                                       */
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
/* list                                                                       */
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

  npx ts-prettier-config init --all

  npx ts-prettier-config init typescript

  npx ts-prettier-config init typescript --preset node

  npx ts-prettier-config init typescript --preset library

  npx ts-prettier-config init typescript --preset bundler

  npx ts-prettier-config init prettier

  npx ts-prettier-config init prettier --sort-imports

  npx ts-prettier-config init eslint

  npx ts-prettier-config init eslint --preset strict

  npx ts-prettier-config init --all --preset node

  npx ts-prettier-config init --all --preset library

  npx ts-prettier-config init --all --preset bundler

  npx ts-prettier-config init --all --force
`);
  });

/* -------------------------------------------------------------------------- */
/* doctor                                                                     */
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

program.parse();
