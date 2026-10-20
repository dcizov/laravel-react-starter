import type { PropsWithChildren } from 'react';
import Heading from '@/components/heading';

type ContentSectionProps = PropsWithChildren<{
    title: string;
    description?: string;
}>;

// Shared header for each settings page: title, description, then the page body.
export default function ContentSection({
    title,
    description,
    children,
}: ContentSectionProps) {
    return (
        <div className="space-y-6">
            <Heading variant="small" title={title} description={description} />
            {children}
        </div>
    );
}
