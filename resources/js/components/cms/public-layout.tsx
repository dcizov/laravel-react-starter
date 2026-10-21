import { Link, usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useTrans } from '@/hooks/use-trans';
import { dashboard, home, login } from '@/routes';

// The shell for public content pages, posts and archives: site name, a few links, and the content below.
export default function PublicLayout({ children }: { children: ReactNode }) {
    const t = useTrans();
    const { name, auth, features } = usePage().props;
    const has = (slug: string) => (features as string[]).includes(slug);

    return (
        <div className="flex min-h-svh flex-col bg-background text-foreground">
            <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-4 md:px-8">
                <Link href={home()} className="font-semibold">
                    {name}
                </Link>
                <nav className="flex flex-wrap items-center gap-4 text-sm">
                    {has('landing') && (
                        <Link href={home()} className="hover:underline">
                            {t('Home')}
                        </Link>
                    )}
                    {has('blog') && (
                        <Link href="/blog" className="hover:underline">
                            {t('Blog')}
                        </Link>
                    )}
                    {auth.user ? (
                        <Button
                            variant="outline"
                            size="sm"
                            render={<Link href={dashboard()} />}
                            nativeButton={false}
                        >
                            {t('Dashboard')}
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            render={<Link href={login()} />}
                            nativeButton={false}
                        >
                            {t('Log in')}
                        </Button>
                    )}
                </nav>
            </header>

            <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10 md:px-8">
                {children}
            </main>

            <footer className="border-t px-4 py-6 text-center text-sm text-muted-foreground">
                © {new Date().getFullYear()} {name}
            </footer>
        </div>
    );
}
