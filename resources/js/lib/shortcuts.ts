// App keyboard shortcuts. Each one is Cmd+Shift+<key> on macOS and Ctrl+Shift+<key> elsewhere.
// Keep the keys here so the menus, hints, and handlers never drift apart.
export const shortcuts = {
    userProfile: { key: 'p', label: 'User profile' },
    profileSettings: { key: 's', label: 'Profile settings' },
    account: { key: 'a', label: 'Account' },
    appearance: { key: 'e', label: 'Appearance' },
    theme: { key: 't', label: 'Toggle theme' },
    logout: { key: 'q', label: 'Log out' },
} as const;

export type ShortcutId = keyof typeof shortcuts;

export function isMac(): boolean {
    if (typeof navigator === 'undefined') {
        return false;
    }

    return /Mac|iPhone|iPad|iPod/.test(
        navigator.platform || navigator.userAgent,
    );
}

// Text shown next to a menu item, e.g. "⇧⌘P" on macOS or "Ctrl+Shift+P" elsewhere.
export function formatShortcut(id: ShortcutId): string {
    const key = shortcuts[id].key.toUpperCase();

    return isMac() ? `⇧⌘${key}` : `Ctrl+Shift+${key}`;
}

// True when the keyboard event is the shortcut for this id.
export function matchesShortcut(event: KeyboardEvent, id: ShortcutId): boolean {
    const mac = isMac();
    const modifier = mac ? event.metaKey : event.ctrlKey;
    const otherModifier = mac ? event.ctrlKey : event.metaKey;

    return (
        modifier &&
        !otherModifier &&
        event.shiftKey &&
        !event.altKey &&
        event.key.toLowerCase() === shortcuts[id].key
    );
}
