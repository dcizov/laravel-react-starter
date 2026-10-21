<?php

namespace App\Features\Cms\Http\Controllers\Public;

use App\Features\Cms\Models\ContentEntry;
use App\Features\Cms\Models\ContentType;
use App\Features\Cms\Support\ContentPresenter;
use App\Features\FeatureRegistry;
use App\Http\Controllers\Controller;
use App\Support\Seo\SeoHead;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The public pages, archives and entries of the content types. Only live entries are shown.
 */
class ContentController extends Controller
{
    public function page(string $slug): Response
    {
        $entry = ContentEntry::query()
            ->where('content_type', 'page')
            ->where('slug', $slug)
            ->live()
            ->first() ?? abort(404);

        return $this->entry($entry, ContentType::findByKey('page') ?? abort(404));
    }

    public function archive(string $type): Response|RedirectResponse
    {
        if ($type === 'post' && app(FeatureRegistry::class)->isEnabled('blog')) {
            return to_route('blog.index');
        }

        $contentType = ContentType::findByKey($type) ?? abort(404);
        abort_unless($contentType->has_archive, 404);

        $entries = ContentEntry::query()
            ->where('content_type', $contentType->key)
            ->live()
            ->orderByDesc('published_at')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('content/archive', [
            'type' => ['key' => $contentType->key, 'label' => $contentType->label, 'singular' => $contentType->singular_label],
            'entries' => $entries->through(fn (ContentEntry $entry) => ContentPresenter::summary($entry)),
            'seo' => SeoHead::for(title: $contentType->label, canonical: url('/content/'.$contentType->key)),
        ]);
    }

    public function show(string $type, string $slug): Response|RedirectResponse
    {
        if ($type === 'post' && app(FeatureRegistry::class)->isEnabled('blog')) {
            return to_route('blog.show', $slug);
        }

        $contentType = ContentType::findByKey($type) ?? abort(404);

        $entry = ContentEntry::query()
            ->where('content_type', $contentType->key)
            ->where('slug', $slug)
            ->live()
            ->first() ?? abort(404);

        return $this->entry($entry, $contentType);
    }

    private function entry(ContentEntry $entry, ContentType $type): Response
    {
        return Inertia::render('content/entry', [
            'entry' => ContentPresenter::page($entry, $type),
        ]);
    }
}
