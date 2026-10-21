import type { CSSProperties } from 'react';
import type {
    Align,
    Animation,
    FontChoice,
    HeadingSize,
    Padding,
    ResolvedStyle,
    Width,
} from '@/components/landing/block-types';

// Tailwind only sees class names written out in full, so every class used here is a literal string.

export const PADDING_CLASSES: Record<Padding, string> = {
    none: 'py-0',
    sm: 'py-6 md:py-8',
    md: 'py-12 md:py-16',
    lg: 'py-16 md:py-24',
    xl: 'py-24 md:py-36',
};

export const WIDTH_CLASSES: Record<Width, string> = {
    narrow: 'max-w-2xl',
    default: 'max-w-5xl',
    wide: 'max-w-6xl',
    full: 'max-w-none',
};

// The heading size is a multiplier, set on the block as --lp-scale (see HEADING_SCALE).
export const HEADING_SCALE: Record<HeadingSize, number> = {
    sm: 0.8,
    md: 1,
    lg: 1.2,
    xl: 1.45,
};

// Section titles and hero headlines. The --lp-scale variable multiplies the size.
export const TITLE_HERO =
    'text-[calc(var(--lp-scale,1)*2.25rem)] sm:text-[calc(var(--lp-scale,1)*3.75rem)] font-semibold tracking-tight text-balance';
export const TITLE_SECTION =
    'text-[calc(var(--lp-scale,1)*1.875rem)] sm:text-[calc(var(--lp-scale,1)*2.25rem)] font-semibold tracking-tight text-balance';

const FONT_STACKS: Record<Exclude<FontChoice, 'theme'>, string> = {
    serif: 'ui-serif, Georgia, Cambria, "Times New Roman", serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
};

// Makes a link safe to use inside url("..."). Quotes and brackets are percent-encoded.
export function cssUrl(url: string): string {
    const encoded = encodeURI(url).replace(
        /[()'"]/g,
        (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`,
    );

    return `url("${encoded}")`;
}

// The inline style for a block's section: colours, background image, font, and heading scale.
export function sectionStyle(style: ResolvedStyle): CSSProperties {
    const result: Record<string, string> = {
        '--lp-scale': String(HEADING_SCALE[style.heading_size]),
    };

    if (style.bg_color) {
        result.backgroundColor = style.bg_color;
    }

    if (style.bg_image) {
        // The overlay darkens the image so text stays readable on top of it.
        const shade = style.bg_overlay / 100;
        result.backgroundImage = `linear-gradient(rgba(0,0,0,${shade}), rgba(0,0,0,${shade})), ${cssUrl(style.bg_image)}`;
        result.backgroundSize = 'cover';
        result.backgroundPosition = 'center';
    }

    // With a background image and no chosen text colour, white text reads best.
    const textColor =
        style.text_color || (style.bg_image ? '#ffffff' : undefined);

    if (textColor) {
        result.color = textColor;
    }

    if (style.font !== 'theme') {
        result.fontFamily = FONT_STACKS[style.font];
    }

    return result as CSSProperties;
}

export function alignClass(align: Align): string {
    return align === 'left'
        ? 'items-start text-left'
        : 'items-center text-center';
}

// The entrance animation. Hidden states only apply when the visitor has not asked for reduced motion.
const ANIMATION_HIDDEN: Record<Exclude<Animation, 'none'>, string> = {
    'fade-up': 'motion-safe:translate-y-8 motion-safe:opacity-0',
    'fade-in': 'motion-safe:opacity-0',
    'zoom-in': 'motion-safe:scale-95 motion-safe:opacity-0',
    'slide-right': 'motion-safe:-translate-x-10 motion-safe:opacity-0',
};

export function animationClass(animation: Animation, visible: boolean): string {
    if (animation === 'none') {
        return '';
    }

    return visible
        ? 'motion-safe:transition-[opacity,translate,scale] motion-safe:duration-700 motion-safe:ease-out'
        : `motion-safe:transition-[opacity,translate,scale] motion-safe:duration-700 ${ANIMATION_HIDDEN[animation]}`;
}
