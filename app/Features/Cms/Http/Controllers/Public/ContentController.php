<?php

namespace App\Features\Cms\Http\Controllers\Public;

use App\Features\Cms\Models\Comment;
use App\Features\Cms\Models\ContentEntry;
use App\Features\Cms\Models\ContentType;
use App\Features\Cms\Support\ContentPresenter;
use App\Features\Cms\Support\EntryListing;
use App\Features\FeatureRegistry;
use App\Http\Controllers\Controller;
use App\Support\Seo\SeoHead;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The public pages, archives, entries, and comments of the content types. Only live entries are shown.
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

    public function archive(Request $request, string $type): Response|RedirectResponse
    {
        if ($type === 'post' && app(FeatureRegistry::class)->isEnabled('blog')) {
            return to_route('blog.index', $request->query());
        }

        $contentType = ContentType::findByKey($type) ?? abort(404);
        abort_unless($contentType->has_archive, 404);

        $listing = EntryListing::terms($contentType->key, $request);

        $entries = EntryListing::filter(
            ContentEntry::query()->where('content_type', $contentType->key)->live(),
            $listing['term'],
        )
            ->orderByDesc('published_at')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('content/archive', [
            'type' => ['key' => $contentType->key, 'label' => $contentType->label, 'singular' => $contentType->singular_label],
            'entries' => $entries->through(fn (ContentEntry $entry) => ContentPresenter::summary($entry)),
            'filter' => $listing['filter'],
            'categories' => in_array(ContentType::SUPPORT_CATEGORY, $contentType->supports ?? [], true) ? $listing['categories'] : [],
            'tags' => in_array(ContentType::SUPPORT_TAG, $contentType->supports ?? [], true) ? $listing['tags'] : [],
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

    /**
     * A visitor's comment on an entry whose type has the comments support. It waits for approval.
     * A hidden field catches simple bots: their submissions are dropped without saying why.
     */
    public function comment(Request $request, string $type, string $slug): RedirectResponse
    {
        $contentType = ContentType::findByKey($type) ?? abort(404);
        abort_unless($contentType->supports(ContentType::SUPPORT_COMMENTS), 404);

        $entry = ContentEntry::query()
            ->where('content_type', $contentType->key)
            ->where('slug', $slug)
            ->live()
            ->first() ?? abort(404);

        if (filled($request->input('website'))) {
            return back();
        }

        $validated = $request->validate([
            'author_name' => ['required', 'string', 'max:80'],
            'author_email' => ['nullable', 'email', 'max:160'],
            'body' => ['required', 'string', 'max:2000'],
        ]);

        Comment::query()->create([
            'entry_id' => $entry->id,
            'author_name' => $validated['author_name'],
            'author_email' => $validated['author_email'] ?? null,
            'body' => $validated['body'],
            'status' => Comment::PENDING,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Thank you. Your comment will appear once it is approved.')]);

        return back();
    }

    private function entry(ContentEntry $entry, ContentType $type): Response
    {
        return Inertia::render('content/entry', [
            'entry' => ContentPresenter::page($entry, $type),
            'commentsEnabled' => $type->supports(ContentType::SUPPORT_COMMENTS),
            'comments' => $type->supports(ContentType::SUPPORT_COMMENTS) ? EntryListing::approvedComments($entry) : [],
        ]);
    }
}
