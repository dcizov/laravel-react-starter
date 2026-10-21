import { Head, Link } from '@inertiajs/react';
import { useTrans } from '@/hooks/use-trans';

// Shown after a visitor follows the unsubscribe link in an email.
export default function NewsletterUnsubscribed() {
    const t = useTrans();

    return (
        <>
            <Head title={t('Unsubscribed')} />

            <div className="mx-auto flex min-h-svh w-full max-w-md flex-col justify-center gap-4 p-6">
                <h1 className="text-2xl font-semibold tracking-tight">
                    {t("You're unsubscribed")}
                </h1>
                <p className="text-sm text-muted-foreground">
                    {t('You will not receive any more newsletters from us.')}
                </p>
                <Link href="/" className="text-sm underline underline-offset-4">
                    {t('Back to the home page')}
                </Link>
            </div>
        </>
    );
}
