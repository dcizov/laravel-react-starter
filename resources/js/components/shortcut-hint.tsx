import { useTrans } from '@/hooks/use-trans';
import { Kbd, KbdGroup } from '@/components/ui/kbd';
import { shortcutKeys, type ShortcutId } from '@/lib/shortcuts';
import { cn } from '@/lib/utils';

// Shows a shortcut as key caps, e.g. G then U.
export function ShortcutHint({
    id,
    className,
}: {
    id: ShortcutId;
    className?: string;
}) {
    const t = useTrans();
    const keys = shortcutKeys(id);

    return (
        <KbdGroup className={cn('ml-auto', className)}>
            {keys.map((key, index) => (
                <span
                    key={`${key}-${index}`}
                    className="inline-flex items-center gap-1"
                >
                    {index > 0 && (
                        <span className="text-xs text-muted-foreground">
                            {t('then')}
                        </span>
                    )}
                    <Kbd className="border bg-background">{key}</Kbd>
                </span>
            ))}
        </KbdGroup>
    );
}
