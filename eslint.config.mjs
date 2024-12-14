import MyrotvoretsConfig from '@myrotvorets/eslint-config-myrotvorets-ts';

/** @type {import('eslint').Linter.Config[]} */
export default [
    {
        ignores: ['**/*.js', '**/*.cjs', '**/*.mjs', '**/*.d.ts', '**/*.d.mts', 'coverage/**', 'dist/**'],
    },
    ...MyrotvoretsConfig,
];
