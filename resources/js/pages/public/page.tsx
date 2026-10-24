import { Head } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { SectionList } from '@/components/sections/section-renderer';
import type { SectionBlock } from '@/lib/sections';

type Props = {
    page: {
        id: number;
        title: string;
        slug: string;
        excerpt: string | null;
        content: SectionBlock[];
        seo_title: string;
        seo_description: string | null;
        robots: string;
        published_at: string | null;
        updated_at: string | null;
    };
};

/** Rendered once at module load so the component body stays pure. */
const YEAR = new Date().getFullYear();

export default function PublicPage({ page }: Props) {
    const noindex = page.robots.includes('noindex');

    return (
        <>
            <Head title={page.seo_title}>
                <meta name="description" content={page.seo_description ?? ''} />
                {noindex ? <meta name="robots" content="noindex,nofollow" /> : null}
            </Head>

            <div className="bg-background text-foreground flex min-h-screen flex-col">
                <header className="border-b border-border/60">
                    <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
                        <a href="/" className="flex items-center gap-2.5 text-sm font-semibold tracking-tight">
                            <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md">
                                <AppLogoIcon className="size-4" />
                            </span>
                            Lattice
                        </a>
                        <nav className="text-muted-foreground flex items-center gap-4 text-sm">
                            <a href="/" className="hover:text-foreground transition-colors">
                                Home
                            </a>
                            <a href="/services" className="hover:text-foreground transition-colors">
                                Services
                            </a>
                            <a href="/about" className="hover:text-foreground transition-colors">
                                About
                            </a>
                            <a
                                href="/contact"
                                className="bg-primary text-primary-foreground rounded-md px-3 py-1.5 text-xs font-medium"
                            >
                                Contact
                            </a>
                        </nav>
                    </div>
                </header>

                <main className="flex-1">
                    <SectionList blocks={page.content ?? []} />
                </main>

                <footer className="text-muted-foreground border-t border-border/60">
                    <div className="mx-auto flex w-full max-w-5xl flex-col gap-2 px-6 py-8 text-xs sm:flex-row sm:items-center sm:justify-between">
                        <p>© {YEAR} Northwind Studio</p>
                        <p>Built with Lattice</p>
                    </div>
                </footer>
            </div>
        </>
    );
}
