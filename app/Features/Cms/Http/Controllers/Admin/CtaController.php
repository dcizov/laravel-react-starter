<?php

namespace App\Features\Cms\Http\Controllers\Admin;

use App\Features\Cms\Http\Requests\CtaRequest;
use App\Features\Cms\Models\Cta;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The call-to-action library. Pages, posts and the landing page use these by reference.
 */
class CtaController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/cms/ctas/index', [
            'ctas' => Cta::query()->orderBy('name')->get()->map(fn (Cta $cta) => [
                'id' => $cta->id,
                'name' => $cta->name,
                'heading' => $cta->heading,
                'text' => $cta->text,
                'buttonLabel' => $cta->button_label,
                'buttonUrl' => $cta->button_url,
            ])->values(),
        ]);
    }

    public function store(CtaRequest $request): RedirectResponse
    {
        Cta::query()->create($this->attributes($request));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Call to action created.')]);

        return back();
    }

    public function update(CtaRequest $request, Cta $cta): RedirectResponse
    {
        $cta->update($this->attributes($request));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Call to action saved.')]);

        return back();
    }

    public function destroy(Cta $cta): RedirectResponse
    {
        // Blocks that use it are dropped on the public page. Their stored reference is kept, so nothing breaks.
        $cta->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Call to action deleted.')]);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function attributes(CtaRequest $request): array
    {
        $validated = $request->validated();

        return [
            'name' => $validated['name'],
            'heading' => $validated['heading'],
            'text' => $validated['text'] ?? null,
            'button_label' => $validated['button_label'] ?? null,
            'button_url' => $validated['button_url'] ?? null,
        ];
    }
}
