/** @type {import('lint-staged').Configuration} */
const lintStagedConfig = {
    '**/*.{ts,tsx,js,jsx}': [
        'prettier --write --cache',
        'eslint --fix --cache',
    ],
    '**/*.{md,mdx,json,css}': 'prettier --write --cache',
    '**/*.php': './vendor/bin/sail pint --dirty',
};

export default lintStagedConfig;
