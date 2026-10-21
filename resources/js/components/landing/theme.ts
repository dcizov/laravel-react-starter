import type { CSSProperties } from 'react';

// The page theme. Colours and sizes are set once for the whole landing page, the way tweakcn edits a
// shadcn theme. The server stores the same fields (App\\Support\\LandingBlocks::validateTheme).
export type LandingTheme = {
    primary: string; // #rrggbb
    background: string; // #rrggbb
    foreground: string; // #rrggbb
    radius: number; // rem, 0 to 1.5
    font: 'sans' | 'serif' | 'mono';
    text_size: 'sm' | 'md' | 'lg';
};

const DEFAULT_THEME: LandingTheme = {
    primary: '#171717',
    background: '#ffffff',
    foreground: '#0a0a0a',
    radius: 0.625,
    font: 'sans',
    text_size: 'md',
};

type ThemePreset = { key: string; label: string; theme: LandingTheme };

// Colour presets, the same idea as a tweakcn theme library. Each one can be tweaked afterwards.
export const THEME_PRESETS: ThemePreset[] = [
    { key: 'default', label: 'Default', theme: DEFAULT_THEME },
    {
        key: 'ocean',
        label: 'Ocean',
        theme: {
            primary: '#0369a1',
            background: '#f8fbff',
            foreground: '#0f172a',
            radius: 0.75,
            font: 'sans',
            text_size: 'md',
        },
    },
    {
        key: 'forest',
        label: 'Forest',
        theme: {
            primary: '#15803d',
            background: '#fafaf7',
            foreground: '#1c1917',
            radius: 0.5,
            font: 'sans',
            text_size: 'md',
        },
    },
    {
        key: 'sunset',
        label: 'Sunset',
        theme: {
            primary: '#ea580c',
            background: '#fffaf5',
            foreground: '#292524',
            radius: 1,
            font: 'sans',
            text_size: 'md',
        },
    },
    {
        key: 'midnight',
        label: 'Midnight',
        theme: {
            primary: '#818cf8',
            background: '#0b0d17',
            foreground: '#e2e8f0',
            radius: 0.625,
            font: 'sans',
            text_size: 'md',
        },
    },
    {
        key: 'editorial',
        label: 'Editorial',
        theme: {
            primary: '#1e3a8a',
            background: '#faf7f2',
            foreground: '#1c1917',
            radius: 0,
            font: 'serif',
            text_size: 'lg',
        },
    },
];

const FONT_STACKS: Record<LandingTheme['font'], string> = {
    sans: 'var(--font-sans)',
    serif: 'ui-serif, Georgia, Cambria, "Times New Roman", serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
};

const TEXT_SIZES: Record<LandingTheme['text_size'], string> = {
    sm: '0.9375rem',
    md: '1rem',
    lg: '1.0625rem',
};

// The colour for text on top of the primary colour. Picks white or near-black by brightness.
function readableOn(hex: string): string {
    const value = hex.replace('#', '');
    const channels = [0, 2, 4].map((start) =>
        parseInt(value.slice(start, start + 2), 16),
    );
    const [red = 0, green = 0, blue = 0] = channels;
    const brightness = (red * 299 + green * 587 + blue * 114) / 1000;

    return brightness > 150 ? '#0a0a0a' : '#ffffff';
}

// The CSS variables for the page. Set on the page wrapper, so every shadcn component inside uses them.
// Muted and border colours are mixed from the background and text colours, so they follow the theme.
function themeVariables(theme: LandingTheme): Record<string, string> {
    return {
        '--background': theme.background,
        '--foreground': theme.foreground,
        '--card': `color-mix(in srgb, ${theme.background} 94%, ${theme.foreground})`,
        '--card-foreground': theme.foreground,
        '--popover': theme.background,
        '--popover-foreground': theme.foreground,
        '--primary': theme.primary,
        '--primary-foreground': readableOn(theme.primary),
        '--secondary': `color-mix(in srgb, ${theme.background} 90%, ${theme.foreground})`,
        '--secondary-foreground': theme.foreground,
        '--muted': `color-mix(in srgb, ${theme.background} 92%, ${theme.foreground})`,
        '--muted-foreground': `color-mix(in srgb, ${theme.foreground} 62%, ${theme.background})`,
        '--accent': `color-mix(in srgb, ${theme.background} 90%, ${theme.foreground})`,
        '--accent-foreground': theme.foreground,
        '--border': `color-mix(in srgb, ${theme.background} 84%, ${theme.foreground})`,
        '--input': `color-mix(in srgb, ${theme.background} 84%, ${theme.foreground})`,
        '--ring': theme.primary,
        '--radius': `${theme.radius}rem`,
    };
}

// The style for the page wrapper: the variables, plus the font and text size.
// In dark mode the page takes a dark background and light text. The primary colour stays, but a dark
// primary is lightened so buttons still show on the dark background.
function darkVariant(theme: LandingTheme): LandingTheme {
    const primaryIsDark = readableOn(theme.primary) === '#ffffff';

    return {
        ...theme,
        background: '#0a0a0a',
        foreground: '#fafafa',
        primary: primaryIsDark ? '#fafafa' : theme.primary,
    };
}

export function themeStyle(
    theme: LandingTheme,
    dark: boolean = false,
): CSSProperties {
    const colours = dark ? darkVariant(theme) : theme;

    return {
        ...themeVariables(colours),
        fontFamily: FONT_STACKS[theme.font],
        fontSize: TEXT_SIZES[theme.text_size],
    } as CSSProperties;
}

// The theme as a CSS block, for copying into a project. Only the variables are included.
export function themeCss(theme: LandingTheme): string {
    const lines = Object.entries(themeVariables(theme)).map(
        ([name, value]) => `  ${name}: ${value};`,
    );

    return `:root {\n${lines.join('\n')}\n}`;
}
