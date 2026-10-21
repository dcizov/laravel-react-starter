import {
    Building2,
    HelpCircle,
    Image as ImageIcon,
    LayoutGrid,
    Megaphone,
    MousePointerClick,
    Quote,
    Sparkles,
    Tag,
    BarChart3,
    Type,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// The shape of every block. Must match App\Support\LandingBlocks on the server, which keeps only these fields.
// Optional fields are left out of the saved data when empty, so the editor and renderers treat them as possibly missing.
export type FeatureItem = { title: string; text?: string };
export type LogoItem = { name: string };
export type StatItem = { value: string; label: string };
export type TestimonialItem = { quote: string; name: string; role?: string };
export type PricingItem = {
    name: string;
    price: string;
    period?: string;
    description?: string;
    features?: string; // One feature per line.
    button_label?: string;
    button_url?: string;
};
export type FaqItem = { question: string; answer?: string };

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
};

export type BlockType = keyof BlockData;

export type LandingBlock = {
    [K in BlockType]: { id: string; type: K; data: BlockData[K] };
}[BlockType];

// Shown in the palette. The label is translated where it is shown.
export const blockTypes: {
    type: BlockType;
    label: string;
    icon: LucideIcon;
}[] = [
    { type: 'hero', label: 'Hero', icon: Sparkles },
    { type: 'logos', label: 'Logo row', icon: Building2 },
    { type: 'features', label: 'Features', icon: LayoutGrid },
    { type: 'stats', label: 'Statistics', icon: BarChart3 },
    { type: 'testimonials', label: 'Testimonials', icon: Quote },
    { type: 'pricing', label: 'Pricing', icon: Tag },
    { type: 'faq', label: 'FAQ', icon: HelpCircle },
    { type: 'cta', label: 'Call to action', icon: Megaphone },
    { type: 'text', label: 'Text', icon: Type },
    { type: 'image', label: 'Image', icon: ImageIcon },
    { type: 'button', label: 'Button', icon: MousePointerClick },
];

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
        items: [{ title: 'First feature', text: 'Describe it in a sentence.' }],
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
};

export function createBlock(type: BlockType): LandingBlock {
    return {
        id: crypto.randomUUID(),
        type,
        data: structuredClone(defaults[type]),
    } as LandingBlock;
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
};
