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

// The modifier keys as shown on this platform, e.g. ["⇧", "⌘"] or ["Ctrl", "Shift"].
export function modifierKeys(withShift: boolean): string[] {
    const mac = isMac();
    const keys = mac ? ['⌘'] : ['Ctrl'];

    return withShift ? [mac ? '⇧' : 'Shift', ...keys] : keys;
}

// The full key sequence for a shortcut, one entry per key cap.
export function shortcutKeys(id: ShortcutId): string[] {
    return [...modifierKeys(true), shortcuts[id].key.toUpperCase()];
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
