#!/usr/bin/env node
// Checks that every UI string the app translates has a German entry in lang/de.json.
//
// Keys are the English texts themselves. This script collects the literal keys passed to
// t('…') in resources/js and to __('…') / trans('…') in app/ and resources/views, then reports
// any key without a translation and any translation whose :placeholders differ from the key.
// Keys built at run time (with ${…} or concatenation) cannot be checked and are skipped.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const locale = 'lang/de.json';

const sources = [
    {
        dir: 'resources/js',
        exts: ['.ts', '.tsx'],
        pattern: /\bt\(\s*(['"`])((?:\\.|(?!\1).)*?)\1/g,
    },
    {
        dir: 'app',
        exts: ['.php'],
        pattern: /\b(?:__|trans)\(\s*(['"])((?:\\.|(?!\1).)*?)\1/g,
    },
    {
        dir: 'resources/views',
        exts: ['.php'],
        pattern: /\b(?:__|trans)\(\s*(['"])((?:\\.|(?!\1).)*?)\1/g,
    },
];

// Test files and generated output do not ship UI text.
const skip = (path) =>
    /\.test\.tsx?$/.test(path) || /[\\/](routes|actions)[\\/]/.test(path);

function* files(dir, exts) {
    for (const name of readdirSync(dir)) {
        const path = join(dir, name);

        if (statSync(path).isDirectory()) {
            yield* files(path, exts);
        } else if (exts.some((ext) => path.endsWith(ext)) && !skip(path)) {
            yield path;
        }
    }
}

// Dotted keys with no spaces are config or validation keys, not UI text.
const isUiKey = (key) => !(key.includes('.') && !key.includes(' '));

const used = new Map();

for (const source of sources) {
    const dir = join(root, source.dir);

    for (const file of files(dir, source.exts)) {
        const text = readFileSync(file, 'utf8');

        for (const match of text.matchAll(source.pattern)) {
            const key = match[2].replace(/\\'/g, "'").replace(/\\"/g, '"');

            if (key.includes('${') || !isUiKey(key)) {
                continue;
            }

            if (!used.has(key)) {
                used.set(key, relative(root, file));
            }
        }
    }
}

const translations = JSON.parse(readFileSync(join(root, locale), 'utf8'));
// Laravel placeholders start a word (":name", "(:count)"). A colon inside a word, as in the German
// gender forms "Abonnent:innen" or "Autor:in", is not one.
const placeholders = (text) =>
    [...text.matchAll(/(?:^|[\s(“„"'])(:[A-Za-z_]+)/g)]
        .map((match) => match[1])
        .sort((a, b) => a.localeCompare(b))
        .join(',');

const missing = [...used.keys()].filter((key) => !(key in translations));
const mismatched = [...used.keys()].filter(
    (key) =>
        key in translations &&
        placeholders(key) !== placeholders(translations[key]),
);

if (missing.length === 0 && mismatched.length === 0) {
    console.log(
        `All ${used.size} translated strings have a German entry in ${locale}.`,
    );
    process.exit(0);
}

for (const key of missing) {
    console.error(
        `missing German translation: ${JSON.stringify(key)} (${used.get(key)})`,
    );
}

for (const key of mismatched) {
    console.error(
        `placeholders differ in ${locale}: ${JSON.stringify(key)} -> ${JSON.stringify(translations[key])}`,
    );
}

console.error(
    `\n${missing.length} missing, ${mismatched.length} with different placeholders.`,
);
process.exit(1);
