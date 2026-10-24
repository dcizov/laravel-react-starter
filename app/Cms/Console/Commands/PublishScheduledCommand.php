<?php

namespace App\Cms\Console\Commands;

use App\Cms\Pages\PageRepository;
use App\Models\Page;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

/**
 * `php artisan pages:publish-scheduled`
 *
 * Publishes every page whose scheduled slot has passed. Scheduled from
 * `routes/console.php` every minute, and safe to run by hand — a page that is
 * no longer scheduled is simply not picked up.
 */
class PublishScheduledCommand extends Command
{
    protected $signature = 'pages:publish-scheduled';

    protected $description = 'Publish pages whose scheduled time has passed';

    public function handle(PageRepository $pages): int
    {
        $due = Page::query()
            ->where('status', Page::STATUS_SCHEDULED)
            ->whereNotNull('scheduled_at')
            ->where('scheduled_at', '<=', now())
            ->orderBy('scheduled_at')
            ->get();

        if ($due->isEmpty()) {
            $this->components->info('Nothing is due.');

            return self::SUCCESS;
        }

        foreach ($due as $page) {
            $pages->publish($page, null, Carbon::parse($page->scheduled_at));

            $this->components->twoColumnDetail($page->slug, '<fg=green>published</>');
        }

        $this->components->info($due->count().' page(s) published.');

        return self::SUCCESS;
    }
}
