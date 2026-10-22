<?php

namespace Addons\Newsletter\Http\Controllers;

use Addons\Newsletter\Models\NewsletterSubscriber;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The public sign-up and unsubscribe pages.
 */
class SubscribeController extends Controller
{
    public function create(): Response
    {
        return Inertia::render('newsletter::subscribe');
    }

    public function store(Request $request): RedirectResponse
    {
        // Addresses are stored in lower case, so "Ada@Example.com" and "ada@example.com" are the same subscriber.
        $request->merge(['email' => Str::lower(trim((string) $request->input('email')))]);

        $data = $request->validate([
            'email' => ['required', 'string', 'email:rfc', 'max:190'],
        ]);

        $subscriber = NewsletterSubscriber::query()->firstOrNew(['email' => $data['email']]);

        // Give the same answer whether or not the address was already on the list, so the form can't be used
        // to find out who has signed up.
        if (! $subscriber->exists || ! $subscriber->isSubscribed()) {
            $subscriber->status = NewsletterSubscriber::SUBSCRIBED;
            $subscriber->subscribed_at = now();
            $subscriber->unsubscribed_at = null;
            $subscriber->token ??= Str::random(48);
            $subscriber->save();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Thanks for subscribing.')]);

        return back();
    }

    public function unsubscribe(string $token): Response
    {
        $subscriber = NewsletterSubscriber::query()->where('token', $token)->firstOrFail();

        if ($subscriber->isSubscribed()) {
            $subscriber->status = NewsletterSubscriber::UNSUBSCRIBED;
            $subscriber->unsubscribed_at = now();
            $subscriber->save();
        }

        return Inertia::render('newsletter::unsubscribed');
    }
}
