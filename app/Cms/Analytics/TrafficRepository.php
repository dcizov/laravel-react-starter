<?php

declare(strict_types=1);

namespace App\Cms\Analytics;

use App\Models\PageView;

/**
 * Page-view aggregation for the dashboard.
 *
 * One grouped query fetches twice the window, so the current series and the
 * comparison against the previous window come from the same statement. Days
 * without traffic are filled in PHP to keep the chart's baseline continuous.
 */
final class TrafficRepository
{
    /**
     * @return array{series: list<array{date: string, label: string, views: int}>, total: int, previous: int, change: int|null}
     */
    public function report(int $days = 14): array
    {
        $start = now()->subDays(($days * 2) - 1)->startOfDay();
        $currentStart = now()->subDays($days - 1)->startOfDay();

        $counts = PageView::query()
            ->where('created_at', '>=', $start)
            ->selectRaw('date(created_at) as day, count(*) as views')
            ->groupBy('day')
            ->pluck('views', 'day');

        $series = [];
        $previous = 0;

        for ($i = 0; $i < $days * 2; $i++) {
            $date = $start->copy()->addDays($i);
            $views = (int) ($counts[$date->toDateString()] ?? 0);

            if ($date->lt($currentStart)) {
                $previous += $views;

                continue;
            }

            $series[] = [
                'date' => $date->toDateString(),
                'label' => $date->format('j M'),
                'views' => $views,
            ];
        }

        $total = array_sum(array_column($series, 'views'));

        return [
            'series' => $series,
            'total' => $total,
            'previous' => $previous,
            'change' => $this->change($total, $previous),
        ];
    }

    private function change(int $current, int $previous): ?int
    {
        if ($previous === 0) {
            return $current === 0 ? null : 100;
        }

        return (int) round((($current - $previous) / $previous) * 100);
    }
}
