import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { shortcutKeys, type ShortcutId } from '@/lib/shortcuts';
import { cn } from '@/lib/utils';

// Shows a shortcut as key caps, e.g. G, then U.
export function ShortcutHint({
    id,
    className,
}: {
    id: ShortcutId;
    className?: string;
}) {
    const keys = shortcutKeys(id);

    return (
        <KbdGroup className={cn('ml-auto', className)}>
            {keys.map((key, index) => (
                <Kbd key={`${key}-${index}`} className="border bg-background">
                    {key}
                </Kbd>
            ))}
        </KbdGroup>
    );
}
