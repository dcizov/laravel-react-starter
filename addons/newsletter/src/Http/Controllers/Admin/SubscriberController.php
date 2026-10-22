<?php

namespace Addons\Newsletter\Http\Controllers\Admin;

use Addons\Newsletter\Models\NewsletterSubscriber;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * The admin list of subscribers: search, delete and CSV export.
 */
class SubscriberController extends Controller
{
    private const PER_PAGE = [10, 25, 50, 100];

    private const SORTS = ['email', 'status', 'subscribed_at', 'unsubscribed_at'];

    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('q', ''));
        $status = in_array($request->query('status'), [NewsletterSubscriber::SUBSCRIBED, NewsletterSubscriber::UNSUBSCRIBED], true)
            ? $request->query('status')
            : 'all';
        $perPage = in_array((int) $request->query('per_page'), self::PER_PAGE, true) ? (int) $request->query('per_page') : 25;
        $sort = in_array($request->query('sort'), self::SORTS, true) ? $request->query('sort') : 'id';
        $direction = $request->query('direction') === 'asc' ? 'asc' : 'desc';

        $subscribers = NewsletterSubscriber::query()
            ->when($search !== '', fn ($query) => $query->whereLike('email', '%'.addcslashes($search, '%_\\').'%', caseSensitive: false))
            ->when($status !== 'all', fn ($query) => $query->where('status', $status))
            ->orderBy($sort, $direction)
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString()
            ->through(fn (NewsletterSubscriber $subscriber) => [
                'id' => $subscriber->id,
                'email' => $subscriber->email,
                'status' => $subscriber->status,
                'subscribedAt' => $subscriber->subscribed_at?->toIso8601String(),
                'unsubscribedAt' => $subscriber->unsubscribed_at?->toIso8601String(),
            ]);

        return Inertia::render('newsletter::admin/newsletter', [
            'subscribers' => $subscribers,
            'query' => [
                'q' => $search,
                'status' => $status,
                'sort' => $sort,
                'direction' => $direction,
                'per_page' => $perPage,
                'page' => $subscribers->currentPage(),
            ],
            'pageSizes' => self::PER_PAGE,
            'counts' => [
                'all' => NewsletterSubscriber::query()->count(),
                'subscribed' => NewsletterSubscriber::query()->where('status', NewsletterSubscriber::SUBSCRIBED)->count(),
                'unsubscribed' => NewsletterSubscriber::query()->where('status', NewsletterSubscriber::UNSUBSCRIBED)->count(),
            ],
        ]);
    }

    /**
     * Removes several subscribers at once, from the bulk action of the list.
     */
    public function bulkDestroy(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:500'],
            'ids.*' => ['integer'],
        ]);

        $removed = NewsletterSubscriber::query()->whereIn('id', $validated['ids'])->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':count subscribers removed.', ['count' => $removed])]);

        return back();
    }

    public function destroy(NewsletterSubscriber $subscriber): RedirectResponse
    {
        $subscriber->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Subscriber removed.')]);

        return back();
    }

    public function exportCsv(): StreamedResponse
    {
        return response()->streamDownload(function () {
            $handle = fopen('php://output', 'w');
            fputcsv($handle, ['email', 'status', 'subscribed_at', 'unsubscribed_at']);

            NewsletterSubscriber::query()->orderBy('id')->chunk(500, function ($subscribers) use ($handle) {
                foreach ($subscribers as $subscriber) {
                    fputcsv($handle, [
                        $subscriber->email,
                        $subscriber->status,
                        $subscriber->subscribed_at?->toDateTimeString(),
                        $subscriber->unsubscribed_at?->toDateTimeString(),
                    ]);
                }
            });

            fclose($handle);
        }, 'newsletter-subscribers.csv', ['Content-Type' => 'text/csv']);
    }
}
