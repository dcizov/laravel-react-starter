import { useEffect, useRef } from 'react';
import {
    isEditableTarget,
    isShortcutComplete,
    isShortcutPrefix,
    shortcuts,
    type ShortcutId,
} from '@/lib/shortcuts';

export type ShortcutHandlers = Partial<Record<ShortcutId, () => void>>;

// How long to wait for the next key of a sequence such as "g" then "p".
const SEQUENCE_TIMEOUT_MS = 1000;

// Runs the handler for each shortcut sequence that was typed. Handlers can change
// between renders; the latest ones are always used.
export function useKeyboardShortcuts(handlers: ShortcutHandlers): void {
    const latest = useRef(handlers);

    useEffect(() => {
        latest.current = handlers;
    });

    useEffect(() => {
        let typed: string[] = [];
        let timer: number | undefined;

        const reset = () => {
            typed = [];
            window.clearTimeout(timer);
        };

        const onKeyDown = (event: KeyboardEvent) => {
            // Modifier combinations belong to the browser or the OS, and typing belongs to the field.
            if (
                event.defaultPrevented ||
                event.repeat ||
                event.ctrlKey ||
                event.metaKey ||
                event.altKey ||
                isEditableTarget(event.target)
            ) {
                reset();

                return;
            }

            const key = event.key.toLowerCase();
            const next = [...typed, key];
            const ids = Object.keys(shortcuts) as ShortcutId[];

            const complete = ids.find((id) => isShortcutComplete(next, id));

            if (complete) {
                reset();

                const handler = latest.current[complete];

                if (handler) {
                    event.preventDefault();
                    handler();
                }

                return;
            }

            if (ids.some((id) => isShortcutPrefix(next, id))) {
                typed = next;
                window.clearTimeout(timer);
                timer = window.setTimeout(reset, SEQUENCE_TIMEOUT_MS);

                return;
            }

            reset();
        };

        window.addEventListener('keydown', onKeyDown);

        return () => {
            window.clearTimeout(timer);
            window.removeEventListener('keydown', onKeyDown);
        };
    }, []);
}
