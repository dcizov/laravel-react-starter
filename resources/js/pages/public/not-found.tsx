import { Head, Link } from '@inertiajs/react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
    return (
        <>
            <Head title="Page not found">
                <meta name="robots" content="noindex" />
            </Head>

            <div className="bg-background text-foreground flex min-h-screen flex-col items-center justify-center px-6 text-center">
                <p className="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">
                    404
                </p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-balance">
                    This page has moved on.
                </h1>
                <p className="text-muted-foreground mt-3 max-w-md text-sm">
                    The link may be old, or the page was never published. Try the home page.
                </p>
                <Button asChild className="mt-6">
                    <Link href="/">Back to the site</Link>
                </Button>
            </div>
        </>
    );
}
