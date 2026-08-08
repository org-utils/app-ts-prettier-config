Absolutely. Based on the package structure and configuration options you've established, here's a complete README suitable for publishing `ts-prettier-config` to npm and GitHub.

# ts-prettier-config

Shared **TypeScript, ESLint, and Prettier configurations** for Node.js, TypeScript libraries, and modern JavaScript/TypeScript projects.

The package provides reusable configuration presets so you can bootstrap a project without manually maintaining the same `tsconfig`, ESLint, and Prettier configuration across repositories.

## Features

* TypeScript configuration presets
* Node.js configuration
* Library configuration
* Bundler configuration
* React configuration
* Next.js configuration
* Strict TypeScript/ESLint configuration
* Shared Prettier configuration
* Optional import sorting with `@trivago/prettier-plugin-sort-imports`
* Shared ESLint flat configurations
* Automatic dependency installation through the CLI
* Automatic package-script setup
* Package-manager detection
* `npm`, `pnpm`, `yarn`, and `bun` support
* Safe configuration initialization
* `--force` support for replacing existing configuration files

---

## Installation

You can install the package globally or use it directly with `npx`.

### npm

```bash
npm install -D ts-prettier-config
```

### pnpm

```bash
pnpm add -D ts-prettier-config
```

### yarn

```bash
yarn add -D ts-prettier-config
```

### Bun

```bash
bun add -D ts-prettier-config
```

Or use the CLI without installing it permanently:

```bash
npx ts-config
```

With pnpm:

```bash
pnpm dlx ts-config
```

With Bun:

```bash
bunx ts-config
```

---

# CLI

The package provides the following CLI:

```bash
ts-config
```

Available commands:

```text
init
list
doctor
```

---

# Initialize a project

The simplest option is:

```bash
npx ts-config init --all
```

This initializes:

* TypeScript
* Prettier
* ESLint

The CLI also installs the required dependencies.

For example, depending on the configuration selected, it can install:

```text
typescript
prettier
eslint
@eslint/js
typescript-eslint
eslint-config-prettier
```

The CLI automatically detects your package manager.

Supported package managers:

* npm
* pnpm
* yarn
* bun

---

# Initialize TypeScript only

```bash
npx ts-config init typescript
```

This creates:

```text
tsconfig.json
```

---

# Initialize Prettier only

```bash
npx ts-config init prettier
```

This creates:

```text
prettier.config.mjs
.prettierignore
```

---

# Initialize ESLint only

```bash
npx ts-config init eslint
```

This creates:

```text
eslint.config.js
```

---

# Initialize everything

```bash
npx ts-config init --all
```

You can also specify a preset:

```bash
npx ts-config init --all --preset node
```

---

# Configuration presets

The CLI provides presets for common project types.

## Node.js

```bash
npx ts-config init --all --preset node
```

This selects:

```text
TypeScript → node
ESLint     → node
```

Recommended for:

* Node.js services
* Fastify applications
* Express applications
* CLI applications
* Backend services
* Workers

---

## Library

```bash
npx ts-config init --all --preset library
```

This selects:

```text
TypeScript → library
ESLint     → library
```

Recommended for:

* npm packages
* shared libraries
* SDKs
* utility packages
* internal packages

---

## Strict ESLint

```bash
npx ts-config init eslint --preset strict
```

This enables the strict ESLint configuration.

---

# TypeScript configurations

The package contains several TypeScript configurations.

```text
tsconfig.base.json
tsconfig.node.json
tsconfig.library.json
tsconfig.bundler.json
tsconfig.next.json
tsconfig.react.json
tsconfig.react-library.json
```

You can use these directly through package exports.

---

## Base TypeScript configuration

```json
{
  "extends": "ts-prettier-config/tsconfig.json"
}
```

Or:

```json
{
  "extends": "ts-prettier-config/tsconfig.base.json"
}
```

Use this as the foundation for custom configurations.

---

# Node.js project

For a Node.js application:

```json
{
  "extends": "ts-prettier-config/tsconfig.node.json"
}
```

Example project:

```text
my-api/
├── src/
│   ├── config/
│   ├── controllers/
│   ├── services/
│   └── index.ts
├── package.json
└── tsconfig.json
```

`tsconfig.json`:

```json
{
  "extends": "ts-prettier-config/tsconfig.node.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

---

# Library project

For an npm package:

```json
{
  "extends": "ts-prettier-config/tsconfig.library.json"
}
```

Example:

```text
my-library/
├── src/
│   ├── index.ts
│   └── utils.ts
├── package.json
└── tsconfig.json
```

You can override package-specific options:

```json
{
  "extends": "ts-prettier-config/tsconfig.library.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

---

# Bundler project

For projects compiled by a bundler such as tsup, Vite, Rollup, or another build tool:

```json
{
  "extends": "ts-prettier-config/tsconfig.bundler.json"
}
```

Example:

```json
{
  "extends": "ts-prettier-config/tsconfig.bundler.json",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["src"]
}
```

This is useful when TypeScript is responsible primarily for type checking while the bundler handles JavaScript output.

---

# React

For React projects:

```json
{
  "extends": "ts-prettier-config/tsconfig.react.json"
}
```

Example:

```json
{
  "extends": "ts-prettier-config/tsconfig.react.json",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["src"]
}
```

---

# React library

For a reusable React component library:

```json
{
  "extends": "ts-prettier-config/tsconfig.react-library.json"
}
```

Example:

```json
{
  "extends": "ts-prettier-config/tsconfig.react-library.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src"]
}
```

---

# Next.js

For a Next.js project:

```json
{
  "extends": "ts-prettier-config/tsconfig.next.json"
}
```

You can still override project-specific settings:

```json
{
  "extends": "ts-prettier-config/tsconfig.next.json",
  "compilerOptions": {
    "strict": true
  }
}
```

---

# Extending and overriding configuration

The configurations are intentionally designed to be overridden.

For example:

```json
{
  "extends": "ts-prettier-config/tsconfig.node.json",
  "compilerOptions": {
    "target": "ES2022",
    "outDir": "./dist",
    "rootDir": "./src",
    "noUnusedLocals": true,
    "noUnusedParameters": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

Your project's options take precedence over the shared configuration.

---

# Prettier

Initialize Prettier:

```bash
npx ts-config init prettier
```

This creates:

```text
prettier.config.mjs
.prettierignore
```

The shared configuration provides consistent formatting across projects.

Example:

```js
/** @type {import('prettier').Config} */
export default {
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,

  semi: true,
  singleQuote: true,
  jsxSingleQuote: false,
  quoteProps: 'as-needed',

  trailingComma: 'all',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'always',

  endOfLine: 'lf',
  embeddedLanguageFormatting: 'auto',
};
```

---

# Prettier import sorting

Import sorting is optional.

Initialize it with:

```bash
npx ts-config init prettier --sort-imports
```

This installs:

```text
prettier
@trivago/prettier-plugin-sort-imports
```

and creates the import-sorting configuration.

The import order is organized into groups such as:

```text
React
↓
Node.js built-ins
↓
Third-party packages
↓
Internal aliases
↓
Side effects
↓
Parent imports
↓
Relative imports
↓
Styles
```

Example:

```ts
import React from 'react';

import fs from 'node:fs';
import path from 'node:path';

import axios from 'axios';
import { z } from 'zod';

import { logger } from '@/lib/logger';

import '../setup';

import { UserService } from '../../services/user.service';
import { User } from './user';
```

---

# ESLint

Initialize ESLint:

```bash
npx ts-config init eslint
```

This creates:

```text
eslint.config.js
```

The package uses ESLint's modern flat configuration format.

The available configurations include:

```text
base
node
library
strict
prettier
```

---

# ESLint + Prettier

For projects using both ESLint and Prettier:

```bash
npx ts-config init --all
```

The CLI installs:

```text
eslint
@eslint/js
typescript-eslint
eslint-config-prettier
prettier
```

This keeps formatting concerns handled by Prettier while ESLint focuses primarily on code quality and correctness.

---

# Package scripts

The CLI automatically adds missing scripts to your `package.json`.

For example:

```json
{
  "scripts": {
    "typecheck": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "lint": "eslint ."
  }
}
```

Existing scripts are not overwritten.

---

# Force overwrite

By default, existing files are preserved.

For example:

```bash
npx ts-config init --all
```

If:

```text
tsconfig.json
prettier.config.mjs
eslint.config.js
```

already exist, they will not be overwritten.

To overwrite them:

```bash
npx ts-config init --all --force
```

Use this carefully.

---

# Doctor

Check your project's configuration:

```bash
npx ts-config doctor
```

Example:

```text
Project:

name: my-api
package manager: pnpm

Configuration:

TypeScript:
✓ tsconfig.json

Prettier:
✓ prettier.config.mjs
✓ .prettierignore

ESLint:
✓ eslint.config.js
```

This is useful for quickly identifying missing configuration files.

---

# List available configurations

```bash
npx ts-config list
```

Example:

```text
Configurations:

typescript
prettier
eslint

Presets:

node
library
strict
```

---

# Recommended setups

## Node.js API

```bash
npx ts-config init --all --preset node
```

Result:

```text
TypeScript
ESLint
Prettier
```

Recommended for:

* Fastify
* Express
* Node.js services
* Microservices
* Background workers

---

## npm library

```bash
npx ts-config init --all --preset library
```

Recommended for:

* npm packages
* SDKs
* shared utilities
* internal libraries

---

## Frontend/React project

```bash
npx ts-config init typescript
npx ts-config init prettier
npx ts-config init eslint
```

Then extend the React configuration manually:

```json
{
  "extends": "ts-prettier-config/tsconfig.react.json"
}
```

---

# Monorepo example

The package can also be used in a monorepo.

Example:

```text
my-monorepo/
├── apps/
│   ├── api/
│   │   └── tsconfig.json
│   └── web/
│       └── tsconfig.json
├── packages/
│   ├── shared/
│   │   └── tsconfig.json
│   └── ui/
│       └── tsconfig.json
├── package.json
└── tsconfig.json
```

Root configuration:

```json
{
  "extends": "ts-prettier-config/tsconfig.base.json"
}
```

Individual packages can then extend the appropriate preset:

```json
{
  "extends": "ts-prettier-config/tsconfig.library.json"
}
```

and applications can use:

```json
{
  "extends": "ts-prettier-config/tsconfig.node.json"
}
```

---

# Direct configuration imports

You don't have to use the CLI.

The configuration files are also exposed through package exports.

For example:

```text
ts-prettier-config/tsconfig.json
ts-prettier-config/tsconfig.node.json
ts-prettier-config/tsconfig.library.json
ts-prettier-config/tsconfig.bundler.json
ts-prettier-config/tsconfig.next.json
ts-prettier-config/tsconfig.react.json
ts-prettier-config/tsconfig.react-library.json
```

Prettier:

```text
ts-prettier-config/prettier
ts-prettier-config/prettier/sort-imports
```

ESLint:

```text
ts-prettier-config/eslint
ts-prettier-config/eslint.js
ts-prettier-config/eslint.node.js
ts-prettier-config/eslint.library.js
ts-prettier-config/eslint.strict.js
ts-prettier-config/eslint.prettier.js
```

---

# Why use this package?

Without a shared configuration package, every repository tends to contain slightly different versions of:

```text
tsconfig.json
eslint.config.js
prettier.config.mjs
.prettierignore
```

Over time this causes:

* inconsistent formatting
* different TypeScript strictness
* duplicated configuration
* configuration drift
* difficult upgrades
* inconsistent linting rules

`ts-prettier-config` provides a single maintained source of truth while still allowing individual projects to override settings when necessary.

---

# Configuration philosophy

The configurations follow these principles:

### Strict by default

TypeScript configurations favor strict type checking and safer defaults.

### Easy to override

Project-specific settings can be overridden through normal TypeScript `extends` behavior.

### Modern module support

Configurations distinguish between:

* Node.js
* bundler-based projects
* libraries
* React
* Next.js

rather than forcing a single module strategy on every project.

### Minimal runtime coupling

The configurations themselves do not introduce runtime dependencies into your application.

### Explicit optional tooling

Features such as import sorting are opt-in rather than forced on every project.

---

# Development

Clone the repository:

```bash
git clone https://github.com/org-utils/app-ts-prettier-config.git
cd app-ts-prettier-config
```

Install dependencies:

```bash
npm install
```

Run tests:

```bash
npm test
```

Run type checking:

```bash
npm run typecheck
```

Run lint:

```bash
npm run lint
```

Format:

```bash
npm run format
```

Check formatting:

```bash
npm run format:check
```

---

# Releases

This project uses [Changesets](https://github.com/changesets/changesets) for versioning and publishing.

Create a changeset:

```bash
npx changeset
```

Check pending changesets:

```bash
npx changeset status
```

The release workflow automatically handles versioning and npm publishing through GitHub Actions.

---

# License

MIT © Anwar

---

## Repository

GitHub:

[https://github.com/org-utils/app-ts-prettier-config](https://github.com/org-utils/app-ts-prettier-config)

## npm

Package:

```text
ts-prettier-config
```
