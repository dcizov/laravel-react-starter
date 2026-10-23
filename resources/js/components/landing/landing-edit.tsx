import { createContext, use, useEffect, useRef, useState } from 'react';
import type {
    ClipboardEvent,
    FocusEvent,
    KeyboardEvent,
    ReactNode,
} from 'react';
import type { Animation, TextEffect } from '@/components/landing/block-types';
import {
    usePrefersReducedMotion,
    useInViewOnce,
} from '@/components/landing/motion-hooks';
import { useTrans } from '@/hooks/use-trans';
import { cn } from '@/lib/utils';

// Only the visual editor provides this. On the public page it is null, so text is plain and nothing is editable.
type EditBinding = {
    blockId: string;
    setText: (path: string, value: string) => void;
};

export const LandingEditContext = createContext<EditBinding | null>(null);

// The text effect of the block being drawn. BlockFrame provides it, and only public headings read it.
export const TextEffectContext = createContext<TextEffect>('none');

type Tags =
    | 'h1'
    | 'h2'
    | 'h3'
    | 'h4'
    | 'p'
    | 'span'
    | 'div'
    | 'li'
    | 'dt'
    | 'dd'
    | 'strong'
    | 'figcaption';

// Text that can be edited in place in the visual editor. The value is saved when the field loses focus,
// so typing does not fill the undo history one key at a time.
export function EditableText({
    path,
    value,
    as: Tag = 'span',
    className,
    multiline = false,
    required = false,
    max = 200,
}: {
    path: string;
    value: string | undefined;
    as?: Tags;
    className?: string;
    multiline?: boolean;
    required?: boolean;
    max?: number;
}) {
    const edit = use(LandingEditContext);
    const textEffect = use(TextEffectContext);
    const t = useTrans();

    if (!edit || value === undefined) {
        if (
            value !== undefined &&
            textEffect === 'words' &&
            (Tag === 'h1' || Tag === 'h2' || Tag === 'h3')
        ) {
            return <WordReveal as={Tag} className={className} text={value} />;
        }

        return <Tag className={className}>{value}</Tag>;
    }

    const commit = (element: HTMLElement) => {
        const raw = element.innerText ?? '';
        let next = multiline
            ? raw.replace(/\n+$/, '')
            : raw.replace(/\s+/g, ' ').trim();
        next = next.slice(0, max);

        // A required field keeps its last value when it is cleared.
        if (next === '' && required) {
            element.textContent = value;

            return;
        }

        if (next !== value) {
            edit.setText(path, next);
        } else {
            // Drops any markup the browser added while editing, so the field holds plain text only.
            element.textContent = value;
        }
    };

    return (
        <Tag
            contentEditable
            suppressContentEditableWarning
            spellCheck={false}
            data-placeholder={t('Text')}
            onBlur={(event: FocusEvent<HTMLElement>) =>
                commit(event.currentTarget)
            }
            onKeyDown={(event: KeyboardEvent<HTMLElement>) => {
                if (event.key === 'Escape') {
                    event.currentTarget.textContent = value;
                    event.currentTarget.blur();
                }

                // Enter ends a single-line field. Multi-line fields keep Enter for a new line.
                if (event.key === 'Enter' && !multiline) {
                    event.preventDefault();
                    event.currentTarget.blur();
                }
            }}
            onPaste={(event: ClipboardEvent<HTMLElement>) => {
                // Paste plain text only, so formatting from other pages does not come with it.
                event.preventDefault();
                const text = event.clipboardData.getData('text/plain');
                document.execCommand(
                    'insertText',
                    false,
                    multiline ? text : text.replace(/\s+/g, ' '),
                );
            }}
            className={cn(
                className,
                'pointer-events-auto cursor-text rounded-sm ring-ring/0 transition-shadow outline-none focus:ring-2 focus:ring-ring/60',
                'empty:before:text-muted-foreground/60 empty:before:content-[attr(data-placeholder)]',
            )}
        >
            {value}
        </Tag>
    );
}

// Headings on the public page: each word blurs into place in turn. Screen readers get the whole sentence once.
function WordReveal({
    as: Tag,
    className,
    text,
}: {
    as: 'h1' | 'h2' | 'h3';
    className?: string;
    text: string;
}) {
    const reduce = usePrefersReducedMotion();
    const ref = useRef<HTMLHeadingElement>(null);
    const seen = useInViewOnce(ref, { enabled: !reduce });

    if (reduce) {
        return (
            <Tag ref={ref} className={className}>
                {text}
            </Tag>
        );
    }

    const words = text.split(' ');

    return (
        <Tag ref={ref} className={className}>
            <span className="sr-only">{text}</span>
            <span aria-hidden="true">
                {words.map((word, index) => (
                    <span
                        // Words can repeat, so the position is part of the key.
                        // eslint-disable-next-line @eslint-react/no-array-index-key
                        key={`${index}-${word}`}
                        className="inline-block transition-[opacity,transform,filter] duration-500 ease-out"
                        style={{
                            transitionDelay: `${index * 70}ms`,
                            ...(seen
                                ? {}
                                : {
                                      opacity: 0,
                                      filter: 'blur(8px)',
                                      transform: 'translateY(6px)',
                                  }),
                        }}
                    >
                        {word}
                        {index < words.length - 1 ? '\u00A0' : ''}
                    </span>
                ))}
            </span>
        </Tag>
    );
}

// A number that counts up when it scrolls into view. Public page only; the editor shows the typed value.
// The text is kept in state, so React never has to fight with a text node it did not create.
export function AnimatedNumber({
    value,
    className,
}: {
    value: string;
    className?: string;
}) {
    const reduce = usePrefersReducedMotion();
    const ref = useRef<HTMLParagraphElement>(null);
    const inView = useInViewOnce(ref, { amount: 0.6 });
    const [text, setText] = useState(value);

    useEffect(() => {
        const match = /^(\D*)(\d[\d,]*(?:\.\d+)?)(.*)$/.exec(value);

        if (!match || !inView || reduce) {
            setText(value);

            return;
        }

        const [, prefix = '', digits = '', suffix = ''] = match;
        const target = Number(digits.replace(/,/g, ''));
        const decimals = digits.includes('.')
            ? (digits.split('.')[1]?.length ?? 0)
            : 0;
        const grouped = digits.includes(',');
        const format = (n: number) =>
            grouped
                ? n.toLocaleString('en-US', {
                      minimumFractionDigits: decimals,
                      maximumFractionDigits: decimals,
                  })
                : n.toFixed(decimals);

        const duration = 1400;
        const start = performance.now();
        let frame = 0;

        const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            // Ease out: fast at first, then slowing towards the final value.
            const eased = 1 - (1 - progress) ** 3;

            if (progress < 1) {
                setText(prefix + format(target * eased) + suffix);
                frame = requestAnimationFrame(tick);
            } else {
                setText(value);
            }
        };

        frame = requestAnimationFrame(tick);

        return () => cancelAnimationFrame(frame);
    }, [inView, reduce, value]);

    return (
        <p ref={ref} className={className}>
            {text}
        </p>
    );
}

// Fades, slides, or zooms a block in the first time it scrolls into view.
// Off in the editor, so the canvas always shows the real content, and off for reduced motion.
const REVEAL_FROM: Record<
    Exclude<Animation, 'none'>,
    { opacity: number; x?: number; y?: number; scale?: number }
> = {
    'fade-up': { opacity: 0, y: 32 },
    'fade-in': { opacity: 0 },
    'zoom-in': { opacity: 0, scale: 0.95 },
    'slide-right': { opacity: 0, x: -40 },
};

export function Reveal({
    animation,
    className,
    children,
}: {
    animation: Animation;
    className?: string;
    children: ReactNode;
}) {
    const reduce = usePrefersReducedMotion();
    const edit = use(LandingEditContext);
    const ref = useRef<HTMLDivElement>(null);
    const enabled = animation !== 'none' && !reduce && !edit;
    const seen = useInViewOnce(ref, { amount: 0.12, enabled });

    const from = animation === 'none' ? null : REVEAL_FROM[animation];
    const hiddenFrom = enabled && !seen ? from : null;

    return (
        <div
            ref={ref}
            className={cn(
                className,
                enabled &&
                    'transition-[opacity,transform] duration-700 ease-out',
            )}
            style={
                hiddenFrom
                    ? {
                          opacity: hiddenFrom.opacity,
                          transform: `translate3d(${hiddenFrom.x ?? 0}px, ${hiddenFrom.y ?? 0}px, 0) scale(${hiddenFrom.scale ?? 1})`,
                      }
                    : undefined
            }
        >
            {children}
        </div>
    );
}
