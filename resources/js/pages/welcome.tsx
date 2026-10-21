import { Head, Link, usePage } from '@inertiajs/react';
import type { LandingBlock } from '@/components/landing/block-types';
import { RenderBlock } from '@/components/landing/render-block';
import type { LandingTheme } from '@/components/landing/theme';
import { themeStyle } from '@/components/landing/theme';
import { Button } from '@/components/ui/button';
import { useAppearance } from '@/hooks/use-appearance';
import { useTrans } from '@/hooks/use-trans';
import { cn } from '@/lib/utils';
import { index as indexAdminLanding } from '@/routes/admin/landing';
import { dashboard, login, register } from '@/routes';

// The landing page. Its blocks and theme come from the admin's published page, or the built-in default.
// In preview the admin's draft is shown, with a banner so it is not mistaken for the public page.
export default function Welcome({
    blocks,
    theme,
    preview,
}: {
    blocks: LandingBlock[];
    theme: LandingTheme;
    preview: boolean;
}) {
    const t = useTrans();
    const { auth } = usePage().props;
    // The page follows the visitor's light or dark appearance.
    const { resolvedAppearance } = useAppearance();
    // A navigation bar block has its own place for sign-in links, so the default header is left out.
    const hasNavbar = blocks.some((block) => block.type === 'navbar');

    return (
        <>
            <Head title={t('Welcome')} />
            <div
                className="flex min-h-svh flex-col bg-background text-foreground"
                style={themeStyle(theme, resolvedAppearance === 'dark')}
            >
                {preview && (
                    <div
                        role="status"
                        className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/40 bg-amber-500/15 px-4 py-2 text-sm"
                    >
                        <span>
                            {t(
                                'Preview of the draft. Visitors do not see this yet.',
                            )}
                        </span>
                        <Button
                            size="sm"
                            variant="outline"
                            render={<Link href={indexAdminLanding()} />}
                            nativeButton={false}
                        >
                            {t('Back to the editor')}
                        </Button>
                    </div>
                )}

                {!hasNavbar && (
                    <header className="flex items-center justify-end gap-2 p-4 md:p-6">
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
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    render={<Link href={login()} />}
                                    nativeButton={false}
                                >
                                    {t('Log in')}
                                </Button>
                                <Button
                                    size="sm"
                                    render={<Link href={register()} />}
                                    nativeButton={false}
                                >
                                    {t('Register')}
                                </Button>
                            </>
                        )}
                    </header>
                )}

                <main
                    className={cn(
                        'flex w-full flex-1 flex-col',
                        !blocks.some((block) => block.type === 'footer') &&
                            'pb-16',
                    )}
                >
                    {blocks.map((block) => (
                        <RenderBlock key={block.id} block={block} />
                    ))}
                </main>
            </div>
        </>
    );
}
