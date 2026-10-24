<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Cms\Addons\AddonCatalog;
use App\Cms\Addons\AddonManager;
use App\Cms\Manifests\AddonManifest;
use App\Cms\Repositories\AddonRepository;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Throwable;

/**
 * The addons screen. Every mutation goes through `AddonManager`, so the
 * invariants (constraints before activation, rollback on failure, data kept on
 * deactivation) live in one place and the UI cannot bypass them.
 *
 * Authorization is `addons.view` to look and `addons.manage` to change — the
 * same abilities the role matrix seeds, so an Editor sees the screen but gets
 * 403 on every write.
 */
class AddonController extends Controller
{
    public function __construct(
        private readonly AddonManager $manager,
        private readonly AddonCatalog $catalog,
        private readonly AddonRepository $addons,
    ) {}

    public function index(Request $request): Response
    {
        $this->authorize('addons.view');

        return Inertia::render('admin/addons/index', [
            'addons' => $this->catalog->cards(),
            'counts' => $this->catalog->counts(),
            'can' => [
                'manage' => $request->user()?->can('addons.manage') ?? false,
            ],
        ]);
    }

    public function install(string $handle): RedirectResponse
    {
        $this->authorize('addons.manage');

        $manifest = $this->findDiscovered($handle);

        if ($manifest === null) {
            return back()->withErrors(['addon' => "Addon [{$handle}] was not found on disk."]);
        }

        try {
            $this->manager->install($manifest);
        } catch (Throwable $exception) {
            return $this->failure($exception, "Addon [{$handle}] could not be installed.");
        }

        return back()->with('toast', ['type' => 'success', 'message' => '“'.$manifest->name.'” installed.']);
    }

    public function activate(string $handle): RedirectResponse
    {
        $this->authorize('addons.manage');

        try {
            $this->manager->activate($handle);
        } catch (Throwable $exception) {
            return $this->failure($exception, "Addon [{$handle}] could not be activated.");
        }

        return back()->with('toast', ['type' => 'success', 'message' => '“'.$handle.'” is active.']);
    }

    public function deactivate(string $handle): RedirectResponse
    {
        $this->authorize('addons.manage');

        try {
            $this->manager->deactivate($handle);
        } catch (Throwable $exception) {
            return $this->failure($exception, "Addon [{$handle}] could not be deactivated.");
        }

        return back()->with('toast', [
            'type' => 'success',
            'message' => '“'.$handle.'” deactivated. Its data is kept.',
        ]);
    }

    /**
     * Uninstall. The UI must send the handle back verbatim — a mistyped handle
     * is the only confirmation that the operator meant this addon.
     */
    public function uninstall(Request $request, string $handle): RedirectResponse
    {
        $this->authorize('addons.manage');

        $request->validate([
            'confirm' => ['required', 'string', 'in:'.$handle],
            'delete_data' => ['sometimes', 'boolean'],
            'delete_files' => ['sometimes', 'boolean'],
        ], [
            'confirm.in' => 'Type the addon handle to confirm.',
        ]);

        try {
            $this->manager->uninstall(
                $handle,
                $request->boolean('delete_data'),
                $request->boolean('delete_files'),
            );
        } catch (Throwable $exception) {
            return $this->failure($exception, "Addon [{$handle}] could not be uninstalled.");
        }

        return back()->with('toast', [
            'type' => 'success',
            'message' => $request->boolean('delete_data')
                ? '“'.$handle.'” removed and its tables dropped.'
                : '“'.$handle.'” removed; its data is still in the database.',
        ]);
    }

    private function failure(Throwable $exception, string $fallback): RedirectResponse
    {
        report($exception);

        $message = $exception instanceof RuntimeException
            ? $exception->getMessage()
            : $fallback;

        return back()->withErrors(['addon' => $message]);
    }

    private function findDiscovered(string $handle): ?AddonManifest
    {
        foreach ($this->addons->discovered() as $manifest) {
            if (strcasecmp($manifest->handle, $handle) === 0) {
                return $manifest;
            }
        }

        return null;
    }
}
