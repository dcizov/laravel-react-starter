// Shapes shared by the content (cms), blog and SEO pages. They match the arrays built by the PHP presenters.

export type Taxonomy = 'category' | 'tag';

export type FieldType =
    'text' | 'textarea' | 'url' | 'number' | 'date' | 'boolean';

export type CustomFieldDef = {
    key: string;
    label: string;
    type: FieldType;
};

export type ContentTypeInfo = {
    key: string;
    label: string;
    singular: string;
    hasArchive: boolean;
    supports: string[];
    fields: CustomFieldDef[];
    builtin: boolean;
    entriesCount: number;
};

export type ContentBlock =
    | { id: string; type: 'heading'; data: { level: 2 | 3; text: string } }
    | { id: string; type: 'paragraph'; data: { text: string } }
    | {
          id: string;
          type: 'quote';
          data: { text: string; cite?: string | null };
      }
    | { id: string; type: 'list'; data: { ordered: boolean; items: string[] } }
    | {
          id: string;
          type: 'image';
          data: { src: string; alt?: string | null; caption?: string | null };
      }
    | {
          id: string;
          type: 'code';
          data: { code: string; language?: string | null };
      }
    | { id: string; type: 'divider'; data: Record<string, never> }
    | {
          id: string;
          type: 'cta';
          data: {
              cta_id?: number;
              heading?: string;
              text?: string | null;
              button_label?: string | null;
              button_url?: string | null;
          };
      };

export type BlockType = ContentBlock['type'];

export type SeoData = {
    title: string;
    description: string | null;
    image: string | null;
    canonical: string | null;
    noindex: boolean;
    site_name: string | null;
    twitter: string | null;
};

export type TermRef = { id: number; name: string; slug: string };

export type PublicEntry = {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    featuredImage: string | null;
    publishedAt: string | null;
    type: { key: string; label: string; singular: string };
    body: ContentBlock[];
    terms: { category: TermRef[]; tag: TermRef[] };
    customFields: {
        key: string;
        label: string;
        type: FieldType;
        value: unknown;
    }[];
    seo: SeoData;
};

export type EntrySummary = {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    featuredImage: string | null;
    publishedAt: string | null;
    url: string;
};

export type PaginatorLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type Paginated<T> = {
    data: T[];
    links: PaginatorLink[];
    current_page: number;
    last_page: number;
};

export type CtaOption = {
    id: number;
    name: string;
    heading: string;
    text?: string | null;
    button_label?: string | null;
    button_url?: string | null;
};

export type TermOption = { id: number; taxonomy: Taxonomy; name: string };
