/** @type {import('lint-staged').Configuration} */
const lintStagedConfig = {
    '**/*.{ts,tsx,js,jsx}': [
        'prettier --write --cache',
        'eslint --fix --cache',
    ],
    '**/*.{md,mdx,json,css}': 'prettier --write --cache',
    // Pint is a dev dependency, so it runs directly. Sail is not required for commits.
    '**/*.php': './vendor/bin/pint --dirty',
};

export default lintStagedConfig;
