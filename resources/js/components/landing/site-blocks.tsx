// Navigation bar and footer for the landing page. Three layouts each, picked by the block's variant.
// On the public page the mobile menu is a native <details>, so it works without script.
// In the visual editor the desktop layout is always shown, so every link stays editable at any width.
import { Menu, X } from 'lucide-react';
import { use } from 'react';
import { AccountLinks, AccountMenu } from '@/components/landing/account-menu';
import type { BlockData, NavLinkItem } from '@/components/landing/block-types';
import {
    EditableText,
    LandingEditContext,
} from '@/components/landing/landing-edit';
import { LinkButton } from '@/components/landing/link-button';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ThemeSwitch } from '@/components/theme-switch';
import { useTrans } from '@/hooks/use-trans';
import { cn } from '@/lib/utils';

// A link on the public page. In the editor it is a span with an editable label, so clicking never navigates.
function SiteLink({
    link,
    path,
    className,
}: {
    link: NavLinkItem;
    path: string;
    className?: string;
}) {
    const edit = use(LandingEditContext);

    if (edit) {
        return (
            <EditableText
                as="span"
                path={`${path}.label`}
                value={link.label}
                required
                max={40}
                className={cn('whitespace-nowrap', className)}
            />
        );
    }

    const external = /^https?:\/\//i.test(link.url);

    return (
        <a
            href={link.url}
            target={external ? '_blank' : undefined}
            rel={external ? 'noreferrer' : undefined}
            className={cn('whitespace-nowrap hover:underline', className)}
        >
            {link.label}
        </a>
    );
}

// Keeps the editor and the public page on the same markup for the brand name.
function Brand({ value, className }: { value?: string; className?: string }) {
    return (
        <EditableText
            as="span"
            path="brand"
            value={value}
            required
            max={40}
            className={cn('font-semibold tracking-tight', className)}
        />
    );
}

// The navigation bar. The logo and the links sit on the left; the theme switch, the language switch,
// the account menu, and the button sit on the right. On the public page the bar is sticky and blurred
// (see BlockFrame in render-block.tsx). Narrow screens get a menu panel under the bar.
export function NavbarBlock({
    data,
    variant,
}: {
    data: BlockData['navbar'];
    variant: number;
}) {
    const edit = use(LandingEditContext);
    const t = useTrans();
    const floating = variant === 1;
    const minimal = variant === 2;
    const initial = (data.brand || '?').trim().charAt(0).toUpperCase();

    const links = data.items.map((link, index) => (
        <SiteLink
            // eslint-disable-next-line @eslint-react/no-array-index-key
            key={index}
            link={link}
            path={`items.${index}`}
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
        />
    ));

    const button =
        !minimal && data.button_label && data.button_url ? (
            <LinkButton
                size="default"
                href={data.button_url}
                label={data.button_label}
                labelPath="button_label"
            />
        ) : null;

    const brand = (
        <div className="flex shrink-0 items-center gap-2.5">
            <span
                aria-hidden="true"
                className="flex size-7 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground"
            >
                {initial}
            </span>
            <Brand value={data.brand} className="text-base" />
        </div>
    );

    return (
        <div className="relative w-full">
            <div
                className={cn(
                    'items-center gap-6 px-4 py-3 md:px-8',
                    floating &&
                        'mx-auto my-3 max-w-5xl rounded-full border bg-background/80 py-2 pr-3 pl-5 shadow-sm backdrop-blur-md',
                    edit ? 'flex' : 'hidden md:flex',
                )}
            >
                {brand}
                <nav className="flex min-w-0 items-center gap-5 overflow-x-auto">
                    {links}
                </nav>
                <div className="ml-auto flex shrink-0 items-center gap-3">
                    {button}
                    <div className="flex items-center gap-1">
                        <ThemeSwitch />
                        <LanguageSwitcher />
                        <AccountMenu />
                    </div>
                </div>
            </div>
            {!edit && (
                <div
                    className={cn(
                        'flex items-center justify-between gap-2 px-4 py-3 md:hidden',
                        floating &&
                            'mx-auto my-3 max-w-5xl rounded-full border bg-background/80 pl-5 backdrop-blur-md',
                    )}
                >
                    {brand}
                    <div className="flex items-center gap-1">
                        <ThemeSwitch />
                        <LanguageSwitcher />
                        <details className="group">
                            <summary
                                aria-label={t('Menu')}
                                className="flex size-9 cursor-pointer list-none items-center justify-center rounded-md hover:bg-muted [&::-webkit-details-marker]:hidden"
                            >
                                <Menu
                                    className="size-5 group-open:hidden"
                                    aria-hidden="true"
                                />
                                <X
                                    className="hidden size-5 group-open:block"
                                    aria-hidden="true"
                                />
                            </summary>
                            <div className="absolute inset-x-0 top-full z-50 flex flex-col gap-4 border-b bg-background/95 p-4 shadow-lg backdrop-blur-md">
                                <nav className="flex flex-col gap-3">
                                    {links}
                                    <AccountLinks />
                                </nav>
                                {button}
                            </div>
                        </details>
                    </div>
                </div>
            )}
        </div>
    );
}

export function FooterBlock({
    data,
    variant,
}: {
    data: BlockData['footer'];
    variant: number;
}) {
    const centred = variant === 1;
    const bar = variant === 2;

    const copyright = data.copyright ? (
        <EditableText
            as="p"
            path="copyright"
            value={data.copyright}
            max={160}
            className="text-sm text-muted-foreground"
        />
    ) : null;

    const brandBlock = (
        <div
            className={cn(
                'flex flex-col gap-3',
                centred ? 'items-center text-center' : 'items-start text-left',
            )}
        >
            {data.brand !== undefined && (
                <Brand value={data.brand} className="text-lg" />
            )}
            {data.text && (
                <EditableText
                    as="p"
                    path="text"
                    value={data.text}
                    multiline
                    max={300}
                    className="max-w-xs text-sm text-pretty text-muted-foreground"
                />
            )}
        </div>
    );

    if (bar) {
        return (
            <div className="flex w-full flex-col gap-6 border-t pt-6 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-2">
                    {data.brand !== undefined && <Brand value={data.brand} />}
                    {copyright}
                </div>
                <nav className="flex flex-wrap gap-x-6 gap-y-3">
                    {data.columns.flatMap((column, c) =>
                        column.links.map((link, l) => (
                            <SiteLink
                                // eslint-disable-next-line @eslint-react/no-array-index-key
                                key={`${c}-${l}`}
                                link={link}
                                path={`columns.${c}.links.${l}`}
                                className="text-sm text-muted-foreground"
                            />
                        )),
                    )}
                </nav>
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col gap-10 border-t pt-10">
            <div
                className={cn(
                    'flex flex-wrap gap-10',
                    centred ? 'flex-col items-center' : 'justify-between',
                )}
            >
                {brandBlock}
                <div
                    className={cn(
                        'flex flex-wrap gap-10',
                        centred && 'justify-center text-center',
                    )}
                >
                    {data.columns.map((column, c) => (
                        <div
                            // eslint-disable-next-line @eslint-react/no-array-index-key
                            key={c}
                            className={cn(
                                'flex min-w-32 flex-col gap-3',
                                centred && 'items-center',
                            )}
                        >
                            <EditableText
                                as="p"
                                path={`columns.${c}.title`}
                                value={column.title}
                                required
                                max={40}
                                className="text-sm font-semibold"
                            />
                            <ul className="flex flex-col gap-2">
                                {column.links.map((link, l) => (
                                    <li
                                        // eslint-disable-next-line @eslint-react/no-array-index-key
                                        key={l}
                                    >
                                        <SiteLink
                                            link={link}
                                            path={`columns.${c}.links.${l}`}
                                            className="text-sm text-muted-foreground"
                                        />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
            {copyright && (
                <div className={cn('border-t pt-6', centred && 'text-center')}>
                    {copyright}
                </div>
            )}
        </div>
    );
}
