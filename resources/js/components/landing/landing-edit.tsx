import { createContext, use, useEffect, useRef, useState } from 'react';
import type {
    ClipboardEvent,
    FocusEvent,
    KeyboardEvent,
    ReactNode,
} from 'react';
import { animationClass } from '@/components/landing/block-style';
import type { Animation } from '@/components/landing/block-types';
import { cn } from '@/lib/utils';

// Only the visual editor provides this. On the public page it is null, so text is plain and nothing is editable.
export type EditBinding = {
    blockId: string;
    setText: (path: string, value: string) => void;
};

export const LandingEditContext = createContext<EditBinding | null>(null);

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

    if (!edit || value === undefined) {
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

// Fades or slides a block in the first time it scrolls into view. The hidden state is only applied when
// the visitor has not asked for reduced motion (the motion-safe: classes in block-style.ts).
export function Reveal({
    animation,
    className,
    children,
}: {
    animation: Animation;
    className?: string;
    children: ReactNode;
}) {
    const ref = useRef<HTMLDivElement>(null);
    // Starts hidden on the server and in the first render too, so the markup matches on both sides.
    const [seen, setSeen] = useState(false);

    useEffect(() => {
        const element = ref.current;

        if (animation === 'none' || !element) {
            return;
        }

        // Without IntersectionObserver the block is simply shown.
        if (typeof IntersectionObserver === 'undefined') {
            setSeen(true);

            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry?.isIntersecting) {
                    setSeen(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.12 },
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, [animation]);

    return (
        <div
            ref={ref}
            className={cn(animationClass(animation, seen), className)}
        >
            {children}
        </div>
    );
}
