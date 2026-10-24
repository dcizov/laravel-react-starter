import { useEffect, useSyncExternalStore } from 'react';

export type ResolvedAppearance = 'light' | 'dark';
export type Appearance = ResolvedAppearance | 'system';

export type UseAppearanceReturn = {
    readonly appearance: Appearance;
    readonly resolvedAppearance: ResolvedAppearance;
    readonly updateAppearance: (mode: Appearance) => void;
};

const APPEARANCE_COOKIE = 'appearance';
const RESOLVED_COOKIE = 'appearance_resolved';

type Snapshot = {
    readonly appearance: Appearance;
    readonly resolvedAppearance: ResolvedAppearance;
};

/**
 * The value the server rendered with.
 *
 * The root template writes the raw preference and the resolved light/dark
 * decision onto `<html>`; reading them at module scope is what makes the first
 * client render identical to the server's. The server is the authority here —
 * `system` cannot be resolved without a browser, so it renders the value the
 * pre-paint script recorded last time (light on a first visit).
 */
function readDocumentSnapshot(): Snapshot {
    if (typeof document === 'undefined') {
        return { appearance: 'system', resolvedAppearance: 'light' };
    }

    const { appearance, appearanceResolved } = document.documentElement.dataset;

    return {
        appearance:
            appearance === 'light' ||
            appearance === 'dark' ||
            appearance === 'system'
                ? appearance
                : 'system',
        resolvedAppearance: appearanceResolved === 'dark' ? 'dark' : 'light',
    };
}

/**
 * A single snapshot object, replaced only when something changes: React
 * compares by identity, so building a fresh object in either getter would make
 * `useSyncExternalStore` loop. The server snapshot is frozen for the same
 * reason — it is what the hydration render reads.
 */
let current: Snapshot = readDocumentSnapshot();
const serverSnapshot: { value: Snapshot } = { value: current };

const getSnapshot = (): Snapshot => current;
const getServerSnapshot = (): Snapshot => serverSnapshot.value;

const listeners = new Set<() => void>();

const subscribe = (callback: () => void) => {
    listeners.add(callback);

    return () => listeners.delete(callback);
};

const notify = (): void => listeners.forEach((listener) => listener());

const prefersDark = (): boolean =>
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

const resolve = (appearance: Appearance): ResolvedAppearance =>
    appearance === 'system' ? (prefersDark() ? 'dark' : 'light') : appearance;

const apply = (resolved: ResolvedAppearance): void => {
    if (typeof document === 'undefined') {
        return;
    }

    document.documentElement.classList.toggle('dark', resolved === 'dark');
    document.documentElement.style.colorScheme = resolved;
};

const persist = (name: string, value: string, days = 365): void => {
    if (typeof document === 'undefined') {
        return;
    }

    document.cookie = `${name}=${value};path=/;max-age=${days * 24 * 60 * 60};SameSite=Lax`;
};

const commit = (next: Snapshot): void => {
    if (
        next.appearance === current.appearance &&
        next.resolvedAppearance === current.resolvedAppearance
    ) {
        return;
    }

    current = next;
    notify();
};

/**
 * Seed the store from the page props the server sent.
 *
 * `withApp` in `app.tsx` runs before the first render on both sides — during
 * the SSR pass and before `hydrateRoot` in the browser — so the server's
 * decision, not the browser's `matchMedia`, drives the first render.
 */
export function seedAppearance(
    appearance: unknown,
    resolvedAppearance: unknown,
): void {
    const next: Snapshot = {
        appearance:
            appearance === 'light' ||
            appearance === 'dark' ||
            appearance === 'system'
                ? appearance
                : current.appearance,
        resolvedAppearance:
            resolvedAppearance === 'dark' || resolvedAppearance === 'light'
                ? resolvedAppearance
                : current.resolvedAppearance,
    };

    if (
        next.appearance === current.appearance &&
        next.resolvedAppearance === current.resolvedAppearance
    ) {
        return;
    }

    // No notify(): this runs while the tree is being created, before any
    // consumer subscribes. The hydration render reads the server snapshot, so
    // it has to move with it.
    current = next;
    serverSnapshot.value = next;
}

/**
 * Called once from `app.tsx` before hydration.
 *
 * It deliberately does not touch the snapshot: the server already decided what
 * the first render looks like. It only makes sure the document carries that
 * decision even when the inline bootstrap script was blocked by CSP.
 */
export function initializeTheme(): void {
    if (typeof window === 'undefined') {
        return;
    }

    apply(current.resolvedAppearance);
}

/**
 * Reconcile `system` with the OS after hydration, and follow later OS changes.
 * Runs after the tree is hydrated, so it can only ever *update* the UI — it
 * cannot cause a mismatch.
 */
function engage(): () => void {
    if (typeof window === 'undefined') {
        return () => {};
    }

    const sync = (): void => {
        const resolvedAppearance = resolve(current.appearance);

        apply(resolvedAppearance);
        persist(RESOLVED_COOKIE, resolvedAppearance);

        if (resolvedAppearance !== current.resolvedAppearance) {
            commit({ appearance: current.appearance, resolvedAppearance });
        }
    };

    sync();

    const media = window.matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', sync);

    return () => media.removeEventListener('change', sync);
}

/**
 * One listener for the whole document, owned by the mounted consumers in
 * aggregate: it starts when the first one mounts and stops when the last one
 * unmounts, whatever order that happens in.
 */
let engaged = 0;
let disengage: (() => void) | null = null;

function acquire(): void {
    if (engaged === 0) {
        disengage = engage();
    }

    engaged += 1;
}

function release(): void {
    engaged = Math.max(0, engaged - 1);

    if (engaged === 0 && disengage !== null) {
        disengage();
        disengage = null;
    }
}

export function useAppearance(): UseAppearanceReturn {
    const snapshot = useSyncExternalStore(
        subscribe,
        getSnapshot,
        getServerSnapshot,
    );

    useEffect(() => {
        acquire();

        return release;
    }, []);

    const updateAppearance = (mode: Appearance): void => {
        const resolvedAppearance = resolve(mode);

        persist(APPEARANCE_COOKIE, mode);
        persist(RESOLVED_COOKIE, resolvedAppearance);
        apply(resolvedAppearance);
        commit({ appearance: mode, resolvedAppearance });
    };

    return {
        appearance: snapshot.appearance,
        resolvedAppearance: snapshot.resolvedAppearance,
        updateAppearance,
    } as const;
}
