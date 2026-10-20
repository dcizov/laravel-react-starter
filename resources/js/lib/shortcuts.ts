// App keyboard shortcuts, in the style of GitHub: press the keys one after another
// (for example "g" then "p"). They use no Ctrl, Cmd, or Alt, so they never clash with
// browser-reserved combinations such as Ctrl+Shift+P (private window) or Ctrl+Shift+T.
// Keep the keys here so the menus, hints, and handlers never drift apart.
export const shortcuts = {
    userProfile: { keys: ['g', 'u'], label: 'User profile' },
    profileSettings: { keys: ['g', 's'], label: 'Profile settings' },
    account: { keys: ['g', 'a'], label: 'Account' },
    appearance: { keys: ['g', 'e'], label: 'Appearance' },
    theme: { keys: ['t'], label: 'Toggle theme' },
    logout: { keys: ['g', 'o'], label: 'Log out' },
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

// The modifier keys as shown on this platform, e.g. ["⌘"] or ["Ctrl"].
export function modifierKeys(): string[] {
    return isMac() ? ['⌘'] : ['Ctrl'];
}

// The keys to press for a shortcut, in order, as key caps (e.g. ["G", "U"]).
export function shortcutKeys(id: ShortcutId): string[] {
    return shortcuts[id].keys.map((key) => key.toUpperCase());
}

// True when the typed keys so far are exactly this shortcut.
export function isShortcutComplete(typed: string[], id: ShortcutId): boolean {
    const keys = shortcuts[id].keys;

    return (
        keys.length === typed.length && keys.every((key, i) => key === typed[i])
    );
}

// True when the typed keys are the start of this shortcut and it still needs more keys.
export function isShortcutPrefix(typed: string[], id: ShortcutId): boolean {
    const keys = shortcuts[id].keys;

    return (
        typed.length < keys.length && typed.every((key, i) => key === keys[i])
    );
}

// Keys typed into fields, editors, and selects must reach the field, not a shortcut.
export function isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
        return false;
    }

    return (
        target.isContentEditable ||
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
    );
}
