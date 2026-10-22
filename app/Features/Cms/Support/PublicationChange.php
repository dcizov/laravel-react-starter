<?php

namespace App\Features\Cms\Support;

use App\Features\Cms\Models\ContentEntry;
use Carbon\CarbonInterface;

/**
 * Decides whether saving an entry changes its publication in a way that needs content.publish.
 *
 * An entry counts as published when its status is published, whether it is live or scheduled for later.
 * Moving between published and not published changes the status. Changing the date of a published entry
 * changes its timing. Draft-to-draft changes need nothing extra. Dates are compared to the minute, so a value
 * the form sends back unchanged is not a change.
 */
final class PublicationChange
{
    /**
     * The field a non-publisher may not change, or null when the change needs no extra permission.
     *
     * @return 'status'|'published_at'|null
     */
    public static function restrictedField(?ContentEntry $entry, string $status, ?CarbonInterface $publishedAt): ?string
    {
        $wasPublished = $entry !== null && $entry->status === ContentEntry::STATUS_PUBLISHED;
        $becomesPublished = $status === ContentEntry::STATUS_PUBLISHED;

        if ($wasPublished !== $becomesPublished) {
            return 'status';
        }

        if ($entry === null || ! $wasPublished) {
            return null;
        }

        return self::minute($entry->published_at) === self::minute($publishedAt) ? null : 'published_at';
    }

    /**
     * The message shown when a change to the given field is refused.
     */
    public static function denialMessage(string $field): string
    {
        return $field === 'published_at'
            ? (string) __('You do not have permission to change the publication date of published content.')
            : (string) __('You do not have permission to publish or unpublish content.');
    }

    private static function minute(?CarbonInterface $date): ?int
    {
        return $date === null ? null : intdiv($date->getTimestamp(), 60);
    }
}
