<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Cms\Themes\ThemeManager;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Throwable;

/**
 * Theme switching. Authorization runs through the permission gates
 * (`themes.view` / `themes.activate`) seeded by the role matrix — themes are
 * site-wide configuration, not a model with an owner.
 */
class AppearanceController extends Controller
{
    public function __construct(private readonly ThemeManager $themes) {}

    public function index(Request $request): Response
    {
        $this->authorize('themes.view');

        return Inertia::render('admin/appearance/index', [
            'themes' => $this->themes->all(),
            'active' => $this->themes->activeTheme(),
            'can' => [
                'activate' => $request->user()?->can('themes.activate') ?? false,
            ],
        ]);
    }

    public function activate(Request $request, string $handle): RedirectResponse
    {
        $this->authorize('themes.activate');

        try {
            $manifest = $this->themes->activate($handle, $request->user());
        } catch (RuntimeException $exception) {
            return back()->withErrors(['theme' => $exception->getMessage()]);
        } catch (Throwable $exception) {
            report($exception);

            return back()->withErrors(['theme' => 'The theme could not be activated.']);
        }

        return back()->with('toast', [
            'type' => 'success',
            'message' => '“'.$manifest->name.'” is now the active theme.',
        ]);
    }
}
