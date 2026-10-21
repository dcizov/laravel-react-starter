<?php

namespace App\Features\Newsletter\Http\Controllers\Admin;

use App\Features\Newsletter\Models\NewsletterSubscriber;
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
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));
        $status = $request->query('status');

        $subscribers = NewsletterSubscriber::query()
            ->when($search !== '', fn ($query) => $query->where('email', 'like', '%'.addcslashes($search, '%_\\').'%'))
            ->when(in_array($status, [NewsletterSubscriber::SUBSCRIBED, NewsletterSubscriber::UNSUBSCRIBED], true), fn ($query) => $query->where('status', $status))
            ->latest('id')
            ->paginate(25)
            ->withQueryString()
            ->through(fn (NewsletterSubscriber $subscriber) => [
                'id' => $subscriber->id,
                'email' => $subscriber->email,
                'status' => $subscriber->status,
                'subscribedAt' => $subscriber->subscribed_at?->toIso8601String(),
                'unsubscribedAt' => $subscriber->unsubscribed_at?->toIso8601String(),
            ]);

        return Inertia::render('admin/newsletter', [
            'subscribers' => $subscribers,
            'filters' => ['search' => $search, 'status' => $status],
            'counts' => [
                'subscribed' => NewsletterSubscriber::query()->where('status', NewsletterSubscriber::SUBSCRIBED)->count(),
                'unsubscribed' => NewsletterSubscriber::query()->where('status', NewsletterSubscriber::UNSUBSCRIBED)->count(),
            ],
        ]);
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
