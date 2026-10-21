import { Head, Link, usePage } from '@inertiajs/react';
import type { LandingBlock } from '@/components/landing/block-types';
import { RenderBlock } from '@/components/landing/render-block';
import { Button } from '@/components/ui/button';
import { useTrans } from '@/hooks/use-trans';
import { index as indexAdminLanding } from '@/routes/admin/landing';
import { dashboard, login, register } from '@/routes';

// The landing page. Its blocks come from the admin's published page, or the built-in default.
// In preview the admin's draft is shown, with a banner so it is not mistaken for the public page.
export default function Welcome({
    blocks,
    preview,
}: {
    blocks: LandingBlock[];
    preview: boolean;
}) {
    const t = useTrans();
    const { auth } = usePage().props;

    return (
        <>
            <Head title={t('Welcome')} />
            <div className="flex min-h-svh flex-col bg-background text-foreground">
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

                <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-2 px-4 pb-16 md:px-8">
                    {blocks.map((block) => (
                        <RenderBlock key={block.id} block={block} />
                    ))}
                </main>
            </div>
        </>
    );
}
