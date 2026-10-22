import { buttonVariants } from '@/components/ui/button';
import { useTrans } from '@/hooks/use-trans';

// Links that open a share dialog on another service, or a mail with the link. They work without scripts.
export function ShareLinks({ url, title }: { url: string; title: string }) {
    const t = useTrans();
    const link = encodeURIComponent(url);
    const text = encodeURIComponent(title);
    const style = buttonVariants({ variant: 'outline', size: 'sm' });

    return (
        <nav
            aria-label={t('Share this post')}
            className="flex flex-wrap items-center gap-2"
        >
            <a
                href={`https://twitter.com/intent/tweet?url=${link}&text=${text}`}
                target="_blank"
                rel="noopener noreferrer"
                className={style}
            >
                {t('Share on X')}
            </a>
            <a
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${link}`}
                target="_blank"
                rel="noopener noreferrer"
                className={style}
            >
                {t('Share on LinkedIn')}
            </a>
            <a href={`mailto:?subject=${text}&body=${link}`} className={style}>
                {t('Share by email')}
            </a>
        </nav>
    );
}
