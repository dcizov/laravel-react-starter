// Navigation bar and footer for the landing page. Three layouts each, picked by the block's variant.
// The name and logo are the app's own (from Settings), so they match the dashboard header.
// On the public page the mobile menu is a native <details>, so it works without script.
// In the visual editor the desktop layout is always shown, so every link stays editable at any width.
import { usePage } from '@inertiajs/react';
import { Menu, X } from 'lucide-react';
import { use } from 'react';
import { AppLogoMark } from '@/components/app-logo';
import {
    AccountLinks,
    AccountMenu,
    useSignedInOnPublicPage,
} from '@/components/landing/account-menu';
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

// The app's logo and name, the same as the dashboard header. Not editable: change them in Settings.
function Brand({ className }: { className?: string }) {
    const { name } = usePage().props;

    return (
        <div className="flex min-w-0 shrink items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary text-primary-foreground">
                <AppLogoMark className="size-5 fill-current" />
            </span>
            <span
                className={cn(
                    'min-w-0 truncate font-semibold tracking-tight',
                    className,
                )}
            >
                {name}
            </span>
        </div>
    );
}

// The navigation bar. The logo and the links sit on the left. On the right: language, theme, then the
// profile menu (or Log in for guests). A call to action is shown unless a signed-in visitor is on the public page.
// The horizontal padding comes from the block frame, so the bar lines up with the rest of the page.
export function NavbarBlock({
    data,
    variant,
}: {
    data: BlockData['navbar'];
    variant: number;
}) {
    const edit = use(LandingEditContext);
    const t = useTrans();
    const signedIn = useSignedInOnPublicPage();
    const floating = variant === 1;
    const minimal = variant === 2;

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
        !minimal && !signedIn && data.button_label && data.button_url ? (
            <LinkButton
                size="default"
                href={data.button_url}
                label={data.button_label}
                labelPath="button_label"
            />
        ) : null;

    const tools = (
        <div className="flex shrink-0 items-center gap-1">
            <LanguageSwitcher />
            <ThemeSwitch />
            <AccountMenu />
        </div>
    );

    return (
        <div className="relative w-full">
            <div
                className={cn(
                    'items-center gap-6 py-3',
                    floating &&
                        'mx-auto my-3 max-w-5xl rounded-full border bg-background/80 py-2 pr-3 pl-5 shadow-sm backdrop-blur-md',
                    edit ? 'flex' : 'hidden @2xl:flex',
                )}
            >
                <Brand />
                <nav className="flex min-w-0 items-center gap-5 overflow-x-auto">
                    {links}
                </nav>
                <div className="ml-auto flex shrink-0 items-center gap-3">
                    {button}
                    {tools}
                </div>
            </div>
            {!edit && (
                <div
                    className={cn(
                        'flex items-center justify-between gap-2 py-3 @2xl:hidden',
                        floating &&
                            'mx-auto my-3 max-w-5xl rounded-full border bg-background/80 pl-5 backdrop-blur-md',
                    )}
                >
                    <Brand />
                    <div className="flex items-center gap-1">
                        <LanguageSwitcher />
                        <ThemeSwitch />
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
                            <div className="absolute inset-x-0 top-full z-50 flex flex-col gap-4 border-b bg-background p-4 shadow-lg">
                                <nav
                                    className="flex flex-col gap-3"
                                    onClick={(event) => {
                                        // Close the menu once a link is chosen, so the page is visible again.
                                        if (
                                            event.target instanceof
                                            HTMLAnchorElement
                                        ) {
                                            event.currentTarget
                                                .closest('details')
                                                ?.removeAttribute('open');
                                        }
                                    }}
                                >
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

// The copyright line. When the admin leaves it empty, it is built from the app's name and the current year.
function copyrightLine(
    name: string,
    custom: string | undefined,
    rights: string,
) {
    return custom || `© ${new Date().getFullYear()} ${name}. ${rights}`;
}

export function FooterBlock({
    data,
    variant,
}: {
    data: BlockData['footer'];
    variant: number;
}) {
    const { name } = usePage().props;
    const t = useTrans();
    const centred = variant === 1;
    const bar = variant === 2;

    const copyright = (
        <EditableText
            as="p"
            path="copyright"
            value={copyrightLine(
                name,
                data.copyright,
                t('All rights reserved.'),
            )}
            max={160}
            className="text-sm text-muted-foreground"
        />
    );

    const brandBlock = (
        <div
            className={cn(
                'flex flex-col gap-3',
                centred ? 'items-center text-center' : 'items-start text-left',
            )}
        >
            <Brand className="text-lg" />
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
            <div className="flex w-full flex-col gap-6 border-t pt-6 @2xl:flex-row @2xl:items-center @2xl:justify-between">
                <div className="flex flex-col gap-2">
                    <Brand />
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
            <div className={cn('border-t pt-6', centred && 'text-center')}>
                {copyright}
            </div>
        </div>
    );
}

// Navigation bar, two more layouts. Two rows puts the links on a second row under the logo.
// Split puts the links in the middle, between the logo and the actions. On phones the links are hidden in Split.
export function NavbarExtra({
    data,
    variant,
}: {
    data: BlockData['navbar'];
    variant: number;
}) {
    const signedIn = useSignedInOnPublicPage();
    const links = data.items.map((link, index) => (
        <SiteLink
            // eslint-disable-next-line @eslint-react/no-array-index-key
            key={index}
            link={link}
            path={`items.${index}`}
            className="text-sm text-muted-foreground hover:text-foreground"
        />
    ));
    const tools = (
        <>
            <LanguageSwitcher />
            <ThemeSwitch />
        </>
    );
    const cta = !signedIn && data.button_label !== undefined && (
        <LinkButton
            href={data.button_url ?? '/register'}
            label={data.button_label}
            labelPath="button_label"
        />
    );

    if (variant === 3) {
        return (
            <div className="flex w-full flex-col gap-3 py-3">
                <div className="flex items-center justify-between gap-2">
                    <Brand />
                    <div className="flex items-center gap-2">
                        {tools}
                        {cta}
                    </div>
                </div>
                <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 border-t pt-3">
                    {links}
                </nav>
            </div>
        );
    }

    return (
        <div className="grid w-full grid-cols-[1fr_auto_1fr] items-center gap-4 py-3">
            <Brand />
            <nav className="hidden items-center gap-6 @2xl:flex">{links}</nav>
            <div className="flex items-center justify-end gap-2">
                {tools}
                {cta}
            </div>
        </div>
    );
}

// Footer, two more layouts. Big sets the brand large above the link columns. Centred stacks everything in the middle.
export function FooterExtra({
    data,
    variant,
}: {
    data: BlockData['footer'];
    variant: number;
}) {
    const { name } = usePage().props;
    const t = useTrans();
    const copyright = (
        <EditableText
            as="p"
            path="copyright"
            value={copyrightLine(
                name,
                data.copyright,
                t('All rights reserved.'),
            )}
            max={160}
            className="text-sm text-muted-foreground"
        />
    );

    if (variant === 3) {
        return (
            <div className="flex w-full flex-col gap-10 border-t pt-10">
                <div className="flex flex-col gap-4">
                    <Brand className="text-3xl" />
                    {data.text && (
                        <EditableText
                            as="p"
                            path="text"
                            value={data.text}
                            multiline
                            max={300}
                            className="max-w-md text-sm text-pretty text-muted-foreground"
                        />
                    )}
                </div>
                <div className="grid gap-8 @xl:grid-cols-2 @4xl:grid-cols-4">
                    {data.columns.map((column, ci) => (
                        <div
                            // eslint-disable-next-line @eslint-react/no-array-index-key
                            key={ci}
                            className="flex flex-col gap-3"
                        >
                            <EditableText
                                as="p"
                                path={`columns.${ci}.title`}
                                value={column.title}
                                required
                                max={60}
                                className="text-sm font-medium"
                            />
                            <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
                                {column.links.map((link, li) => (
                                    <li
                                        // eslint-disable-next-line @eslint-react/no-array-index-key
                                        key={li}
                                    >
                                        <SiteLink
                                            link={link}
                                            path={`columns.${ci}.links.${li}`}
                                            className="hover:text-foreground"
                                        />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
                {copyright}
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col items-center gap-6 border-t pt-10 text-center">
            <Brand className="text-lg" />
            {data.text && (
                <EditableText
                    as="p"
                    path="text"
                    value={data.text}
                    multiline
                    max={300}
                    className="max-w-md text-sm text-pretty text-muted-foreground"
                />
            )}
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
                {data.columns.flatMap((column, ci) =>
                    column.links.map((link, li) => (
                        <SiteLink
                            // eslint-disable-next-line @eslint-react/no-array-index-key
                            key={`${ci}-${li}`}
                            link={link}
                            path={`columns.${ci}.links.${li}`}
                            className="hover:text-foreground"
                        />
                    )),
                )}
            </div>
            {copyright}
        </div>
    );
}
