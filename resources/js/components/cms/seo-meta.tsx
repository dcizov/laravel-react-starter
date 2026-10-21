import { Head } from '@inertiajs/react';
import type { SeoData } from '@/types/cms';

// The page's search and sharing tags, from the server's SEO decision (see App\Support\Seo\SeoHead).
export default function SeoMeta({ seo }: { seo: SeoData }) {
    return (
        <Head title={seo.title}>
            {seo.description && (
                <meta name="description" content={seo.description} />
            )}
            {seo.noindex && <meta name="robots" content="noindex, nofollow" />}
            {seo.canonical && <link rel="canonical" href={seo.canonical} />}
            <meta property="og:title" content={seo.title} />
            {seo.description && (
                <meta property="og:description" content={seo.description} />
            )}
            <meta property="og:type" content="website" />
            {seo.canonical && (
                <meta property="og:url" content={seo.canonical} />
            )}
            {seo.site_name && (
                <meta property="og:site_name" content={seo.site_name} />
            )}
            {seo.image && <meta property="og:image" content={seo.image} />}
            <meta
                name="twitter:card"
                content={seo.image ? 'summary_large_image' : 'summary'}
            />
            {seo.twitter && (
                <meta name="twitter:site" content={`@${seo.twitter}`} />
            )}
        </Head>
    );
}
