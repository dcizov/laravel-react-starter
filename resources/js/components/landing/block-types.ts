import {
    Building2,
    ChartColumn,
    CircleCheck,
    Globe,
    HelpCircle,
    Image as ImageIcon,
    Layers,
    LayoutGrid,
    LockKeyhole,
    PanelBottom,
    PanelTop,
    Megaphone,
    MousePointerClick,
    Palette,
    Quote,
    Rocket,
    Settings,
    ShieldCheck,
    Sparkles,
    Tag,
    Type,
    Users,
    Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// The shape of every block. Must match App\\Support\\LandingBlocks on the server, which keeps only these fields.
// Optional fields are left out of the saved data when empty, so the editor and renderers treat them as possibly missing.
export type FeatureItem = { title: string; text?: string; icon?: string };
export type LogoItem = { name: string };
export type StatItem = { value: string; label: string };
export type TestimonialItem = { quote: string; name: string; role?: string };
export type PricingItem = {
    name: string;
    price: string;
    period?: string;
    badge?: string;
    description?: string;
    features?: string; // One feature per line.
    button_label?: string;
    button_url?: string;
};
export type FaqItem = { question: string; answer?: string };
export type NavLinkItem = { label: string; url: string };
export type FooterColumn = { title: string; links: NavLinkItem[] };

export type BlockData = {
    hero: {
        title: string;
        text?: string;
        button_label?: string;
        button_url?: string;
        image?: string;
    };
    features: { title?: string; items: FeatureItem[] };
    text: { heading?: string; body: string };
    image: { src: string; alt?: string };
    button: { label: string; url: string };
    logos: { title?: string; items: LogoItem[] };
    stats: { title?: string; items: StatItem[] };
    testimonials: { title?: string; items: TestimonialItem[] };
    pricing: { title?: string; items: PricingItem[] };
    faq: { title?: string; items: FaqItem[] };
    cta: {
        title: string;
        text?: string;
        button_label?: string;
        button_url?: string;
    };
    navbar: {
        brand: string;
        items: NavLinkItem[];
        button_label?: string;
        button_url?: string;
    };
    footer: {
        brand?: string;
        text?: string;
        columns: FooterColumn[];
        copyright?: string;
    };
};

export type BlockType = keyof BlockData;

// How a block looks. Every key is optional in the saved data; missing keys use DEFAULT_STYLE.
// The server accepts only these keys and values (App\\Support\\LandingBlocks::fieldRules).
export type Padding = 'none' | 'sm' | 'md' | 'lg' | 'xl';
export type Width = 'narrow' | 'default' | 'wide' | 'full';
export type Align = 'left' | 'center';
export type HeadingSize = 'sm' | 'md' | 'lg' | 'xl';
export type FontChoice = 'theme' | 'serif' | 'mono';
export type Animation =
    'none' | 'fade-up' | 'fade-in' | 'zoom-in' | 'slide-right';
export type TextEffect = 'none' | 'words';

export type BlockStyle = Partial<{
    variant: number; // 0, 1, or 2. Each block type names its layouts in VARIANT_NAMES.
    bg_color: string; // A #rrggbb colour, or '' for the page background.
    bg_image: string; // A link to an image, or '' for none.
    bg_overlay: number; // 0 to 80. How dark the layer over a background image is, in percent.
    text_color: string; // A #rrggbb colour, or '' for the theme colour.
    padding: Padding;
    width: Width;
    align: Align;
    heading_size: HeadingSize;
    font: FontChoice;
    animation: Animation;
    text_effect: TextEffect; // 'words' reveals headings one word at a time.
}>;

export type ResolvedStyle = Required<BlockStyle>;

export const DEFAULT_STYLE: ResolvedStyle = {
    variant: 0,
    bg_color: '',
    bg_image: '',
    bg_overlay: 40,
    text_color: '',
    padding: 'md',
    width: 'default',
    align: 'center',
    heading_size: 'md',
    font: 'theme',
    animation: 'fade-up',
    text_effect: 'none',
};

// Fills in the defaults for any setting the block does not store.
export function resolveStyle(block: { style?: BlockStyle }): ResolvedStyle {
    return { ...DEFAULT_STYLE, ...block.style };
}

export const PADDING_LABELS: Record<Padding, string> = {
    none: 'None',
    sm: 'Small',
    md: 'Medium',
    lg: 'Large',
    xl: 'Extra large',
};

export const WIDTH_LABELS: Record<Width, string> = {
    narrow: 'Narrow',
    default: 'Default',
    wide: 'Wide',
    full: 'Full width',
};

export const HEADING_LABELS: Record<HeadingSize, string> = {
    sm: 'Small',
    md: 'Medium',
    lg: 'Large',
    xl: 'Extra large',
};

export const FONT_LABELS: Record<FontChoice, string> = {
    theme: 'Page font',
    serif: 'Serif',
    mono: 'Monospace',
};

export const ANIMATION_LABELS: Record<Animation, string> = {
    none: 'None',
    'fade-up': 'Fade up',
    'fade-in': 'Fade in',
    'zoom-in': 'Zoom in',
    'slide-right': 'Slide in from left',
};

// The layouts each block type can use. The index is saved as style.variant.
export const TEXT_EFFECT_LABELS: Record<TextEffect, string> = {
    none: 'None',
    words: 'Words, one by one',
};

export const VARIANT_NAMES: Record<BlockType, string[]> = {
    navbar: ['Bar', 'Floating', 'Minimal'],
    footer: ['Columns', 'Stacked', 'Bar'],
    hero: ['Centered', 'Split with image', 'Editorial'],
    logos: ['Grid', 'Row', 'Ruled'],
    features: ['Cards', 'List', 'Columns'],
    stats: ['Cards', 'Plain', 'Tiles'],
    testimonials: ['Pairs', 'Featured', 'Wall'],
    pricing: ['Cards', 'Rows', 'Focus'],
    faq: ['Accordion', 'Open list', 'Two columns'],
    cta: ['Banner', 'Outline', 'Split'],
    text: ['Centered', 'Accent rule', 'Two columns'],
    image: ['Rounded', 'Full width'],
    button: ['Centered', 'Left aligned'],
};

export function variantCount(type: BlockType): number {
    return VARIANT_NAMES[type].length;
}

export type LandingBlock = {
    [K in BlockType]: {
        id: string;
        type: K;
        data: BlockData[K];
        style?: BlockStyle;
    };
}[BlockType];

// Shown in the palette. The label is translated where it is shown.
export const blockTypes: {
    type: BlockType;
    label: string;
    icon: LucideIcon;
}[] = [
    { type: 'navbar', label: 'Navigation bar', icon: PanelTop },
    { type: 'hero', label: 'Hero', icon: Sparkles },
    { type: 'logos', label: 'Logo row', icon: Building2 },
    { type: 'features', label: 'Features', icon: LayoutGrid },
    { type: 'stats', label: 'Statistics', icon: ChartColumn },
    { type: 'testimonials', label: 'Testimonials', icon: Quote },
    { type: 'pricing', label: 'Pricing', icon: Tag },
    { type: 'faq', label: 'FAQ', icon: HelpCircle },
    { type: 'cta', label: 'Call to action', icon: Megaphone },
    { type: 'text', label: 'Text', icon: Type },
    { type: 'image', label: 'Image', icon: ImageIcon },
    { type: 'button', label: 'Button', icon: MousePointerClick },
    { type: 'footer', label: 'Footer', icon: PanelBottom },
];

// The icons a feature can show. The key is what is saved; the server accepts only these keys.
export const FEATURE_ICONS: Record<string, LucideIcon> = {
    zap: Zap,
    shield: ShieldCheck,
    layers: Layers,
    users: Users,
    chart: ChartColumn,
    globe: Globe,
    lock: LockKeyhole,
    sparkles: Sparkles,
    check: CircleCheck,
    rocket: Rocket,
    palette: Palette,
    settings: Settings,
};

export const FEATURE_ICON_LABELS: Record<string, string> = {
    zap: 'Lightning',
    shield: 'Shield',
    layers: 'Layers',
    users: 'People',
    chart: 'Chart',
    globe: 'Globe',
    lock: 'Lock',
    sparkles: 'Sparkles',
    check: 'Check',
    rocket: 'Rocket',
    palette: 'Design',
    settings: 'Settings',
};

// The starting content of a new block of each type.
const defaults: { [K in BlockType]: BlockData[K] } = {
    hero: {
        title: 'Headline',
        text: 'A short introduction for visitors.',
        button_label: '',
        button_url: '',
        image: '',
    },
    logos: {
        title: 'Trusted by',
        items: [{ name: 'Partner' }],
    },
    features: {
        title: 'Features',
        items: [
            {
                title: 'First feature',
                text: 'Describe it in a sentence.',
                icon: 'sparkles',
            },
        ],
    },
    stats: {
        title: '',
        items: [{ value: '10k+', label: 'Happy customers' }],
    },
    testimonials: {
        title: 'What people say',
        items: [
            {
                quote: 'Write a short quote here.',
                name: 'Name',
                role: 'Role, company',
            },
        ],
    },
    pricing: {
        title: 'Pricing',
        items: [
            {
                name: 'Starter',
                badge: '',
                price: '€9',
                period: '/month',
                description: 'For individuals getting started.',
                features: 'First feature\nSecond feature',
                button_label: 'Choose',
                button_url: '',
            },
        ],
    },
    faq: {
        title: 'Questions',
        items: [{ question: 'Your question?', answer: 'The answer.' }],
    },
    cta: {
        title: 'Ready to start?',
        text: 'A short line that invites the visitor to act.',
        button_label: 'Get started',
        button_url: '',
    },
    text: { heading: 'Heading', body: 'Write something here.' },
    image: { src: '', alt: '' },
    button: { label: 'Button', url: '' },
    navbar: {
        brand: 'Brand',
        items: [
            { label: 'Features', url: '#features' },
            { label: 'Pricing', url: '#pricing' },
            { label: 'FAQ', url: '#faq' },
        ],
        button_label: 'Get started',
        button_url: '/register',
    },
    footer: {
        brand: 'Brand',
        text: 'A short line about what you do.',
        columns: [
            {
                title: 'Product',
                links: [
                    { label: 'Features', url: '#features' },
                    { label: 'Pricing', url: '#pricing' },
                ],
            },
            {
                title: 'Company',
                links: [{ label: 'Contact', url: '/register' }],
            },
        ],
        copyright: '© 2026 Brand. All rights reserved.',
    },
};

export function createBlock(type: BlockType): LandingBlock {
    return {
        id: crypto.randomUUID(),
        type,
        data: structuredClone(defaults[type]),
        style: { ...DEFAULT_STYLE },
    } as LandingBlock;
}

// A copy of a block with a new id, for duplicating and for presets.
export function cloneBlock(block: LandingBlock): LandingBlock {
    return {
        ...structuredClone(block),
        id: crypto.randomUUID(),
    } as LandingBlock;
}

// Sets a value at a dotted path such as "items.0.title" and returns a new block. Used by inline editing.
export function setBlockField(
    block: LandingBlock,
    path: string,
    value: string,
): LandingBlock {
    const keys = ['data', ...path.split('.')];

    const update = (node: unknown, index: number): unknown => {
        const key = keys[index];

        if (key === undefined) {
            return value;
        }

        if (Array.isArray(node)) {
            const copy = [...node];
            const position = Number(key);
            copy[position] = update(node[position], index + 1);

            return copy;
        }

        const object = (node ?? {}) as Record<string, unknown>;

        return { ...object, [key]: update(object[key], index + 1) };
    };

    return update(block, 0) as LandingBlock;
}

// Blocks in the app stay within these limits. The server enforces the same numbers.
export const MAX_BLOCKS = 40;
export const MAX_FEATURE_ITEMS = 12;

// The most items a list block can hold, by block type.
export const MAX_ITEMS: Partial<Record<BlockType, number>> = {
    features: 12,
    logos: 12,
    stats: 6,
    testimonials: 6,
    pricing: 4,
    faq: 10,
    navbar: 6,
    footer: 4,
};

// Links inside a navbar or footer column.
export const MAX_LINKS = 6;
