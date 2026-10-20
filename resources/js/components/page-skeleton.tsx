import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Stands in for a page while the next one loads, so the layout does not jump.
export function PageSkeleton() {
    return (
        <div
            role="status"
            aria-label="Loading"
            className="flex h-full flex-1 flex-col gap-6 p-4 md:p-6"
        >
            <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
                <div className="space-y-2">
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-80 max-w-full" />
                </div>

                <Card>
                    <CardHeader>
                        <Skeleton className="h-5 w-40" />
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
