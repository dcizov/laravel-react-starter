import type { ThemePageProps } from '@/components/themes/theme-shell';

/**
 * Props shaped exactly like the server's, so hydration tests compare the real
 * component tree rather than a simplified sketch.
 */
export const site = {
    name: 'Northwind Studio',
    tagline: 'Design for things that last',
    description: 'A design studio',
    home_url: 'http://localhost:8000',
    year: 2026,
};

export const theme = {
    handle: 'aperture',
    name: 'Aperture',
    tokens: {
        accent: 'oklch(0.51 0.19 264)',
        radius: '0.625rem',
        font: 'Inter',
    },
    degraded: false,
};

export const shellProps: ThemePageProps = {
    site,
    menus: {
        main: [
            { id: 1, label: 'Home', url: '/', children: [] },
            { id: 2, label: 'Journal', url: '/blog', children: [] },
        ],
        footer: [],
    },
    theme,
};

export const blogPost = {
    id: 1,
    title: 'Why we still draw with a pencil',
    slug: 'why-we-still-draw-with-a-pencil',
    excerpt: 'A note on craft.',
    image: null,
    url: '/blog/why-we-still-draw-with-a-pencil',
    category: 'Craft',
    author: 'Ada',
    published_label: 'May 2026',
    reading_minutes: 4,
};

export const blogProps = {
    ...shellProps,
    posts: { data: [blogPost], total: 1, links: [] },
    categories: [],
    tags: [],
    feed_url: '/blog/rss.xml',
};

export const blogShowProps = {
    ...shellProps,
    post: {
        id: 1,
        title: blogPost.title,
        slug: blogPost.slug,
        excerpt: blogPost.excerpt,
        body: 'A pencil is a decision you cannot undo.',
        blocks: [
            {
                type: 'paragraph',
                text: 'A pencil is a decision you cannot undo.',
            },
        ],
        url: blogPost.url,
        published_label: 'May 2026',
        reading_minutes: 4,
        author: 'Ada',
        category: { name: 'Craft', slug: 'craft' },
        tags: ['craft'],
        meta_description: 'A note on craft.',
        image: null,
    },
    related: [],
};

export const themePageProps = {
    ...shellProps,
    page: {
        id: 1,
        title: 'Home',
        slug: 'home',
        excerpt: null,
        content: [
            {
                id: 'hero-1',
                section: 'hero',
                enabled: true,
                content: {
                    eyebrow: 'Design studio',
                    heading: 'Identity that outlasts the launch',
                    body: 'We design brands, websites and printed matter.',
                    align: 'center',
                    cta_label: '',
                    cta_url: '',
                    image: null,
                },
            },
            {
                id: 'features-1',
                section: 'feature-grid',
                enabled: true,
                content: {
                    heading: 'Three things, done properly',
                    intro: 'A handful of projects a year.',
                    features: [
                        {
                            title: 'Brand identity',
                            body: 'Naming and marks.',
                            icon: 'sparkles',
                        },
                        {
                            title: 'Digital products',
                            body: 'Sites and interfaces.',
                            icon: 'layers',
                        },
                    ],
                },
            },
        ],
        seo_title: 'Northwind Studio',
        seo_description: 'Design',
        robots: 'index,follow',
        published_at: null,
        updated_at: null,
    },
    sections: [],
    section_data: {},
};

export const sharedProps = {
    name: 'Lattice',
    app: { name: 'Lattice', version: '0.1.0' },
    auth: { user: null, can: {} },
    navigation: [],
    settings: { public: { logo: null } },
    flash: {},
    sidebarOpen: true,
    appearance: { appearance: 'dark', resolved: 'dark' },
    errors: {},
};
