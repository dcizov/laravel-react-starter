import {
    Image as ImageIcon,
    LayoutGrid,
    MousePointerClick,
    Sparkles,
    Type,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// The shape of every block. Must match App\Support\LandingBlocks on the server, which keeps only these fields.
export type FeatureItem = { title: string; text: string };

export type BlockData = {
    hero: {
        title: string;
        text: string;
        button_label: string;
        button_url: string;
        image: string;
    };
    features: { title: string; items: FeatureItem[] };
    text: { heading: string; body: string };
    image: { src: string; alt: string };
    button: { label: string; url: string };
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
    { type: 'features', label: 'Features', icon: LayoutGrid },
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
    features: {
        title: 'Features',
        items: [{ title: 'First feature', text: 'Describe it in a sentence.' }],
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
