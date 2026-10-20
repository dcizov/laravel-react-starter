import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { shortcutKeys, type ShortcutId } from '@/lib/shortcuts';
import { cn } from '@/lib/utils';

// Shows a shortcut as key caps, e.g. ⇧ ⌘ P.
export function ShortcutHint({
    id,
    className,
}: {
    id: ShortcutId;
    className?: string;
}) {
    return (
        <KbdGroup className={cn('ml-auto', className)}>
            {shortcutKeys(id).map((key) => (
                <Kbd key={key} className="border bg-background">
                    {key}
                </Kbd>
            ))}
        </KbdGroup>
    );
}
