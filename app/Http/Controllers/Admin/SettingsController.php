<?php

namespace App\Http\Controllers\Admin;

use App\Cms\Settings\SettingRepository;
use App\Cms\Settings\SettingSchema;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSettingsRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Site settings, one screen per group. The form is generated from
 * `SettingSchema`, so the controller only moves data in and out.
 */
class SettingsController extends Controller
{
    public function __construct(private readonly SettingRepository $settings) {}

    public function index(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->can('settings.view'), 403);

        return redirect()->route('admin.settings.show', ['group' => SettingSchema::handles()[0]]);
    }

    public function show(Request $request, string $group): Response
    {
        abort_unless($request->user()?->can('settings.view'), 403);
        abort_if(SettingSchema::group($group) === null, 404);

        return Inertia::render('admin/settings/index', [
            'groups' => array_map(
                fn (string $handle): array => [
                    'key' => $handle,
                    'label' => SettingSchema::group($handle)['label'],
                    'icon' => SettingSchema::group($handle)['icon'],
                    'url' => route('admin.settings.show', ['group' => $handle]),
                ],
                SettingSchema::handles(),
            ),
            'group' => $this->settings->groupPayload($group) + [
                'url' => route('admin.settings.update', ['group' => $group]),
            ],
            'can' => ['update' => $request->user()?->can('settings.update') ?? false],
        ]);
    }

    public function update(UpdateSettingsRequest $request, string $group): RedirectResponse
    {
        abort_if(SettingSchema::group($group) === null, 404);

        $data = $request->validated();

        // A secret left blank means "keep the stored one", not "erase it".
        foreach (SettingSchema::group($group)['fields'] as $field) {
            if ($field['type'] === 'secret' && blank($data[$field['key']] ?? null)) {
                unset($data[$field['key']]);
            }
        }

        $this->settings->put($group, $data);

        return back()->with('toast', ['type' => 'success', 'message' => 'Settings saved.']);
    }
}
