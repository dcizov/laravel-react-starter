import { animate, motion, useInView, useReducedMotion } from 'motion/react';
import { createContext, use, useEffect, useRef, useState } from 'react';
import type {
    ClipboardEvent,
    FocusEvent,
    KeyboardEvent,
    ReactNode,
} from 'react';
import type { Animation, TextEffect } from '@/components/landing/block-types';
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
            data-placeholder="Text"
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
    const reduce = useReducedMotion();

    if (reduce) {
        return <Tag className={className}>{text}</Tag>;
    }

    const words = text.split(' ');

    return (
        <Tag className={className}>
            <span className="sr-only">{text}</span>
            <span aria-hidden="true">
                {words.map((word, index) => (
                    <motion.span
                        // Words can repeat, so the position is part of the key.
                        // eslint-disable-next-line @eslint-react/no-array-index-key
                        key={`${index}-${word}`}
                        className="inline-block"
                        initial={{ opacity: 0, filter: 'blur(8px)', y: 6 }}
                        whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                        viewport={{ once: true }}
                        transition={{
                            duration: 0.5,
                            delay: index * 0.07,
                            ease: 'easeOut',
                        }}
                    >
                        {word}
                        {index < words.length - 1 ? '\u00A0' : ''}
                    </motion.span>
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
    const reduce = useReducedMotion();
    const ref = useRef<HTMLParagraphElement>(null);
    const inView = useInView(ref, { once: true, amount: 0.6 });
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

        const controls = animate(0, target, {
            duration: 1.4,
            ease: 'easeOut',
            onUpdate: (latest) => setText(prefix + format(latest) + suffix),
            onComplete: () => setText(value),
        });

        return () => controls.stop();
    }, [inView, reduce, value]);

    return (
        <p ref={ref} className={className}>
            {text}
        </p>
    );
}

// Fades, slides, or zooms a block in the first time it scrolls into view (motion's whileInView).
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
    const reduce = useReducedMotion();
    const edit = use(LandingEditContext);

    if (animation === 'none' || reduce || edit) {
        return <div className={className}>{children}</div>;
    }

    return (
        <motion.div
            className={className}
            initial={REVEAL_FROM[animation]}
            whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.12 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
        >
            {children}
        </motion.div>
    );
}
