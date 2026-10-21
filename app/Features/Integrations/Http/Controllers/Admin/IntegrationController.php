<?php

namespace App\Features\Integrations\Http\Controllers\Admin;

use App\Features\Integrations\Catalogue;
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
    // Shown in place of a saved secret. It never includes any characters of the real value.
    public const SECRET_MASK = '••••••••';

    public function index(): Response
    {
        $connections = IntegrationConnection::query()->get()->keyBy('integration_key');

        $integrations = array_map(function (array $integration) use ($connections) {
            /** @var IntegrationConnection|null $connection */
            $connection = $connections->get($integration['key']);
            $credentials = $connection?->credentials ?? [];

            return [
                'key' => $integration['key'],
                'name' => $integration['name'],
                'description' => $integration['description'],
                'connected' => $connection !== null,
                'connectedAt' => $connection?->connected_at?->toIso8601String(),
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

        return Inertia::render('admin/integrations/index', [
            'integrations' => $integrations,
            'secretMask' => self::SECRET_MASK,
        ]);
    }

    public function update(Request $request, string $integration): RedirectResponse
    {
        $definition = Catalogue::find($integration) ?? abort(404);

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

        IntegrationConnection::query()->where('integration_key', $integration)->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':name is disconnected.', ['name' => $definition['name']])]);

        return back();
    }
}
