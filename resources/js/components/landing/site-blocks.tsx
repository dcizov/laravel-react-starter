// Navigation bar and footer for the landing page. Three layouts each, picked by the block's variant.
// On the public page the mobile menu is a native <details>, so it works without script.
// In the visual editor the desktop layout is always shown, so every link stays editable at any width.
import { Menu, X } from 'lucide-react';
import { use } from 'react';
import type { BlockData, NavLinkItem } from '@/components/landing/block-types';
import {
    EditableText,
    LandingEditContext,
} from '@/components/landing/landing-edit';
import { LinkButton } from '@/components/landing/link-button';
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

export function NavbarBlock({
    data,
    variant,
}: {
    data: BlockData['navbar'];
    variant: number;
}) {
    const edit = use(LandingEditContext);
    const centred = variant === 1;
    const minimal = variant === 2;

    const links = data.items.map((link, index) => (
        <SiteLink
            // eslint-disable-next-line @eslint-react/no-array-index-key
            key={index}
            link={link}
            path={`items.${index}`}
            className={
                minimal
                    ? 'text-sm text-muted-foreground'
                    : 'text-sm font-medium'
            }
        />
    ));

    const button =
        !minimal && data.button_label && data.button_url ? (
            <LinkButton
                size="default"
                variant={centred ? 'outline' : 'default'}
                href={data.button_url}
                label={data.button_label}
                labelPath="button_label"
            />
        ) : null;

    return (
        <div className="flex w-full flex-col gap-4">
            {!edit && (
                <details className="group w-full md:hidden">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
                        <Brand value={data.brand} />
                        <Menu
                            className="size-5 group-open:hidden"
                            aria-hidden="true"
                        />
                        <X
                            className="hidden size-5 group-open:block"
                            aria-hidden="true"
                        />
                    </summary>
                    <div className="flex flex-col gap-4 pt-4">
                        <nav className="flex flex-col gap-3">{links}</nav>
                        {button}
                    </div>
                </details>
            )}
            <div
                className={cn(
                    'items-center gap-6',
                    edit ? 'flex' : 'hidden md:flex',
                    centred ? 'flex-col' : 'justify-between',
                    minimal && 'border-b pb-4',
                )}
            >
                <Brand
                    value={data.brand}
                    className={centred ? 'text-lg' : undefined}
                />
                <nav
                    className={cn(
                        'flex flex-wrap items-center gap-6',
                        centred && 'justify-center gap-8',
                    )}
                >
                    {links}
                </nav>
                {button && <div className="flex">{button}</div>}
            </div>
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
