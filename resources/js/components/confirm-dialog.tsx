import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
    processing = false,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    onConfirm: () => void;
    processing?: boolean;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-2xl border-[#e5e7e2] bg-white sm:max-w-md">
                <div className="mb-1 flex size-10 items-center justify-center rounded-xl bg-[#f8eae6] text-[#a65f50]">
                    <AlertTriangle className="size-5" />
                </div>
                <DialogHeader>
                    <DialogTitle className="text-[#2c453b]">
                        {title}
                    </DialogTitle>
                    <DialogDescription className="leading-6">
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="mt-3">
                    <Button
                        variant="outline"
                        className="rounded-xl"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        className="rounded-xl bg-[#9e544b] hover:bg-[#89473f]"
                        disabled={processing}
                        onClick={onConfirm}
                    >
                        {processing ? 'Deleting…' : 'Delete'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
