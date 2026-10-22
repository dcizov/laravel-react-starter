<?php

namespace App\Features\Integrations\Http\Controllers\Admin;

use App\Features\Integrations\Catalogue;
use App\Features\Integrations\GoogleOAuth;
use App\Features\Integrations\Models\IntegrationConnection;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Sign-in with Google for the Gmail and Google Calendar integrations.
 */
class GoogleOAuthController extends Controller
{
    private const SESSION_KEY = 'integrations.oauth';

    public function __construct(private readonly GoogleOAuth $google) {}

    public function redirect(string $integration): RedirectResponse
    {
        $definition = Catalogue::find($integration) ?? abort(404);
        abort_unless($definition['auth'] === 'oauth', 404);

        if (! $this->google->configured()) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Google sign-in is not set up. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to the environment.')]);

            return to_route('admin.integrations.index');
        }

        $state = GoogleOAuth::newState();
        session()->put(self::SESSION_KEY, ['integration' => $integration, 'state' => $state]);

        return redirect()->away($this->google->authorizationUrl($definition['scopes'], $state));
    }

    public function callback(Request $request): RedirectResponse
    {
        $pending = session()->pull(self::SESSION_KEY);
        $definition = Catalogue::find($pending['integration'] ?? '');

        // The state must match what this admin started. Anything else is treated as a forged callback.
        if ($definition === null || ! hash_equals((string) ($pending['state'] ?? ''), (string) $request->query('state', ''))) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('The sign-in could not be verified. Please try again.')]);

            return to_route('admin.integrations.index');
        }

        if ($request->query('error') !== null || ! $request->filled('code')) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Sign-in was cancelled.')]);

            return to_route('admin.integrations.index');
        }

        $refreshToken = $this->google->exchangeCode((string) $request->query('code'));

        if ($refreshToken === null) {
            Inertia::flash('toast', ['type' => 'error', 'message' => __('Google did not accept the sign-in. Please try again.')]);

            return to_route('admin.integrations.index');
        }

        $connection = IntegrationConnection::query()->firstWhere('integration_key', $definition['key']);

        IntegrationConnection::query()->updateOrCreate(
            ['integration_key' => $definition['key']],
            [
                'credentials' => ['refresh_token' => $refreshToken],
                'connected_at' => $connection === null ? now() : ($connection->connected_at ?? now()),
            ],
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name is connected.', ['name' => $definition['name']])]);

        return to_route('admin.integrations.index');
    }
}
