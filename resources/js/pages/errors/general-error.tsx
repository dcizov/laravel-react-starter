import { Head } from '@inertiajs/react';
import { GoBack } from '@/components/errors/go-back';
import { useTrans } from '@/hooks/use-trans';
import { cn } from '@/lib/utils';

// The 500 page. `minimal` hides the code and the buttons, for places that are already framed.
export default function GeneralError({
    className,
    minimal = false,
}: {
    className?: string;
    minimal?: boolean;
}) {
    const t = useTrans();

    return (
        <>
            <Head title={t('Something went wrong')} />
            <div className={cn('h-svh w-full', className)}>
                <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
                    {!minimal && (
                        <h1 className="text-[7rem] leading-tight font-bold">
                            500
                        </h1>
                    )}
                    <span className="font-medium">
                        {t('Oops! Something went wrong.')}
                    </span>
                    <p className="text-center text-muted-foreground">
                        {t('We apologize for the inconvenience.')}
                        <br />
                        {t('Please try again later.')}
                    </p>
                    {!minimal && <GoBack />}
                </div>
            </div>
        </>
    );
}
