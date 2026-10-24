/**
 * Types shared by the editor, the canvas and the public renderer.
 * They mirror `App\Cms\Sections\{Section,Field}` — PHP stays the source of truth.
 */

export type FieldType =
    | 'text'
    | 'textarea'
    | 'richtext'
    | 'number'
    | 'boolean'
    | 'select'
    | 'url'
    | 'media'
    | 'color'
    | 'repeater';

export type FieldOption = { value: string; label: string };

export type FieldDef = {
    key: string;
    label: string;
    type: FieldType;
    default: unknown;
    required: boolean;
    rules: string[];
    options: FieldOption[];
    fields: FieldDef[];
    hint: string | null;
};

export type SectionDef = {
    key: string;
    label: string;
    description: string;
    icon: string;
    defaults: Record<string, unknown>;
    fields: FieldDef[];
};

export type SectionContent = Record<string, unknown>;

export type SectionBlock = {
    id: string;
    section: string;
    enabled: boolean;
    content: SectionContent;
};

export type PageStatus = 'draft' | 'scheduled' | 'published';

export function sectionDef(
    sections: SectionDef[],
    key: string,
): SectionDef | undefined {
    return sections.find((section) => section.key === key);
}

export function str(value: unknown, fallback = ''): string {
    return typeof value === 'string' ? value : fallback;
}

export function num(value: unknown, fallback = 0): number {
    return typeof value === 'number' ? value : fallback;
}

export function bool(value: unknown, fallback = false): boolean {
    return typeof value === 'boolean' ? value : fallback;
}

export function rows(value: unknown): SectionContent[] {
    return Array.isArray(value) ? (value as SectionContent[]) : [];
}

/**
 * `content.3.content.heading` -> 3, used to scroll to the invalid section.
 */
export function blockIndexFromErrorKey(key: string): number | null {
    const match = /^content\.(\d+)\./.exec(key);

    return match ? Number(match[1]) : null;
}
