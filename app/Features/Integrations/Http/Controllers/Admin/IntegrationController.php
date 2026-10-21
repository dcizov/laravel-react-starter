<?php

namespace App\Features\Integrations\Http\Controllers\Admin;

use App\Features\Integrations\Catalogue;
use App\Features\Integrations\GoogleOAuth;
use App\Features\Integrations\Models\IntegrationConnection;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The admin catalogue of third-party tools: connect, update and disconnect.
 */
class IntegrationController extends Controller
{
    public function __construct(private readonly GoogleOAuth $google) {}

    public function index(): Response
    {
        $connections = IntegrationConnection::query()->get()->keyBy('integration_key');

        $integrations = array_map(function (array $integration) use ($connections) {
            /** @var IntegrationConnection|null $connection */
            $connection = $connections->get($integration['key']);
            $credentials = $connection?->credentials ?? [];
            $isOAuth = $integration['auth'] === 'oauth';

            return [
                'key' => $integration['key'],
                'name' => $integration['name'],
                'description' => $integration['description'],
                'favicon' => $integration['favicon'],
                'auth' => $integration['auth'],
                'connected' => $connection !== null,
                'connectedAt' => $connection?->connected_at?->toIso8601String(),
                // Sign-in tools need the Google client to be configured before anyone can connect.
                'available' => $isOAuth ? $this->google->configured() : true,
                'connectUrl' => $isOAuth ? route('admin.integrations.oauth.redirect', $integration['key']) : null,
                'fields' => array_map(fn (array $field) => [
                    'key' => $field['key'],
                    'label' => $field['label'],
                    'secret' => $field['secret'],
                    // Secret values are never sent to the browser. Other values are shown so they can be edited.
                    'value' => $field['secret'] ? null : (string) ($credentials[$field['key']] ?? ''),
                    'configured' => filled($credentials[$field['key']] ?? null),
                ], $integration['fields']),
            ];
        }, Catalogue::all());

        // Secrets are write-only: the browser only learns whether one is saved (the configured flag above).
        return Inertia::render('admin/integrations/index', [
            'integrations' => $integrations,
        ]);
    }

    public function update(Request $request, string $integration): RedirectResponse
    {
        $definition = Catalogue::find($integration) ?? abort(404);

        // Sign-in tools take no typed values. They connect through the redirect, not this form.
        abort_unless($definition['auth'] === 'token', 404);

        $connection = IntegrationConnection::query()->firstWhere('integration_key', $integration);
        $saved = $connection?->credentials ?? [];

        $rules = [];

        foreach ($definition['fields'] as $field) {
            // A saved secret does not have to be typed again, so it is optional once one is stored.
            $optional = $field['secret'] && filled($saved[$field['key']] ?? null);
            $rules[$field['key']] = ['string', 'max:500', $optional ? 'nullable' : 'required'];
        }

        $validated = $request->validate($rules);

        $credentials = [];

        foreach ($definition['fields'] as $field) {
            $value = trim((string) ($validated[$field['key']] ?? ''));

            // A blank secret keeps the saved value.
            $credentials[$field['key']] = ($field['secret'] && $value === '')
                ? (string) ($saved[$field['key']] ?? '')
                : $value;
        }

        IntegrationConnection::query()->updateOrCreate(
            ['integration_key' => $integration],
            [
                'credentials' => $credentials,
                'connected_at' => $connection?->connected_at ?? now(),
            ],
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name is connected.', ['name' => $definition['name']])]);

        return back();
    }

    public function destroy(string $integration): RedirectResponse
    {
        $definition = Catalogue::find($integration) ?? abort(404);

        $connection = IntegrationConnection::query()->firstWhere('integration_key', $integration);

        // Ask Google to revoke the access as well. The local connection is removed even if that fails.
        if ($definition['auth'] === 'oauth' && filled($connection?->credentials['refresh_token'] ?? null)) {
            $this->google->revoke($connection->credentials['refresh_token']);
        }

        IntegrationConnection::query()->where('integration_key', $integration)->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name is disconnected.', ['name' => $definition['name']])]);

        return back();
    }
}
