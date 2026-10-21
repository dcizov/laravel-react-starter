import type * as React from 'react';
import { Button } from '@/components/ui/button';
import {
    Drawer,
    DrawerClose,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { useTrans } from '@/hooks/use-trans';

// What the detail drawer shows for one row. The table builds it from renderDetail.
export type DataTableDetail = {
    title: string;
    description?: string;
    body: React.ReactNode;
    // Buttons for the row, such as "Edit". "Close" is always added.
    footer?: React.ReactNode;
};

// Wraps a cell so that clicking it opens a drawer with the row's details.
// The drawer slides in from the right, or from the bottom on phones.
export function DataTableRowDetail({
    detail,
    children,
}: {
    detail: DataTableDetail;
    children: React.ReactNode;
}) {
    const t = useTrans();
    const isMobile = useIsMobile();

    return (
        <Drawer swipeDirection={isMobile ? 'down' : 'right'}>
            <DrawerTrigger
                render={
                    <Button
                        variant="link"
                        className="h-auto justify-start p-0 text-foreground"
                    />
                }
            >
                {children}
            </DrawerTrigger>
            {/* On desktop the drawer floats inside the window, rounded on every corner. */}
            <DrawerContent
                className={
                    isMobile
                        ? undefined
                        : 'inset-y-2 right-2 h-auto rounded-xl border shadow-lg data-[swipe-direction=right]:right-2 data-[swipe-direction=right]:rounded-xl'
                }
            >
                <DrawerHeader className="gap-1">
                    <DrawerTitle>{detail.title}</DrawerTitle>
                    {detail.description && (
                        <DrawerDescription>
                            {detail.description}
                        </DrawerDescription>
                    )}
                </DrawerHeader>
                <div className="flex flex-col gap-4 overflow-y-auto px-4 text-sm">
                    {detail.body}
                </div>
                <DrawerFooter>
                    {detail.footer}
                    <DrawerClose render={<Button variant="outline" />}>
                        {t('Close')}
                    </DrawerClose>
                </DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
