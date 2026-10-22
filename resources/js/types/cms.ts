import type { RichDoc } from '@/components/cms/rich-text';

// Shapes shared by the content (cms), blog and SEO pages. They match the arrays built by the PHP presenters.

export type Taxonomy = 'category' | 'tag';

export type FieldType =
    | 'text'
    | 'textarea'
    | 'url'
    | 'number'
    | 'date'
    | 'boolean';

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
    // Rich text (doc) is what the editor saves. text and items are the plain form that older content still has.
    | {
          id: string;
          type: 'paragraph';
          data: { doc?: RichDoc; text?: string | null };
      }
    | {
          id: string;
          type: 'quote';
          data: { doc?: RichDoc; text?: string | null; cite?: string | null };
      }
    | {
          id: string;
          type: 'list';
          data: { ordered: boolean; doc?: RichDoc; items?: string[] | null };
      }
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
    author: PublicAuthor | null;
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

// The author of an entry. url is the author's page on the blog, or null when the blog is switched off.
export type PublicAuthor = { name: string; url: string | null };

export type EntrySummary = {
    id: number;
    title: string;
    slug: string;
    excerpt: string | null;
    featuredImage: string | null;
    publishedAt: string | null;
    author: PublicAuthor | null;
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
