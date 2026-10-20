import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowUpRightIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useTrans } from '@/hooks/use-trans';
import { dashboard, login } from '@/routes';
import { register } from '@/routes';

// Links to the Laravel resources shown on the welcome card.
const resources = [
    {
        lead: 'Read the',
        label: 'Documentation',
        href: 'https://laravel.com/docs',
    },
    {
        lead: 'Watch video tutorials at',
        label: 'Laracasts',
        href: 'https://laracasts.com',
    },
];

export default function Welcome() {
    const t = useTrans();
    const { auth } = usePage().props;

    return (
        <>
            <Head title={t('Welcome')} />
            <div className="flex min-h-svh flex-col bg-background text-foreground">
                <header className="flex items-center justify-end gap-2 p-4 md:p-6">
                    {auth.user ? (
                        <Button
                            variant="outline"
                            size="sm"
                            render={<Link href={dashboard()} />}
                        >
                            {t('Dashboard')}
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="ghost"
                                size="sm"
                                render={<Link href={login()} />}
                            >
                                {t('Log in')}
                            </Button>
                            <Button
                                size="sm"
                                render={<Link href={register()} />}
                            >
                                {t('Register')}
                            </Button>
                        </>
                    )}
                </header>

                <main className="flex flex-1 items-center justify-center p-4 md:p-8">
                    <Card className="w-full max-w-2xl">
                        <CardHeader>
                            <CardTitle>{t("Let's get started")}</CardTitle>
                            <CardDescription>
                                {t('Laravel has an incredibly rich ecosystem.')}{' '}
                                {t('We suggest starting with the following.')}
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="grid gap-2">
                            {resources.map((resource) => (
                                <a
                                    key={resource.href}
                                    href={resource.href}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm transition-colors hover:bg-muted"
                                >
                                    <span>
                                        {t(resource.lead)}{' '}
                                        <span className="font-medium">
                                            {t(resource.label)}
                                        </span>
                                    </span>
                                    <ArrowUpRightIcon
                                        aria-hidden="true"
                                        className="size-4 text-muted-foreground"
                                    />
                                </a>
                            ))}
                        </CardContent>

                        <Separator />

                        <CardFooter className="justify-end">
                            <Button
                                render={
                                    <a
                                        href="https://cloud.laravel.com"
                                        target="_blank"
                                        rel="noreferrer"
                                    />
                                }
                            >
                                {t('Deploy now')}
                                <ArrowUpRightIcon aria-hidden="true" />
                            </Button>
                        </CardFooter>
                    </Card>
                </main>
            </div>
        </>
    );
}
