import { useEffect, useRef } from 'react';
import { matchesShortcut, shortcuts, type ShortcutId } from '@/lib/shortcuts';

export type ShortcutHandlers = Partial<Record<ShortcutId, () => void>>;

// Runs the handler for each shortcut that was pressed. Handlers can change
// between renders; the latest ones are always used.
export function useKeyboardShortcuts(handlers: ShortcutHandlers): void {
    const latest = useRef(handlers);

    useEffect(() => {
        latest.current = handlers;
    });

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.defaultPrevented || event.repeat) {
                return;
            }

            for (const id of Object.keys(shortcuts) as ShortcutId[]) {
                const handler = latest.current[id];

                if (handler && matchesShortcut(event, id)) {
                    event.preventDefault();
                    handler();

                    return;
                }
            }
        };

        window.addEventListener('keydown', onKeyDown);

        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);
}
