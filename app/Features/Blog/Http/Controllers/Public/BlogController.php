<?php

namespace App\Features\Blog\Http\Controllers\Public;

use App\Features\Blog\Models\Comment;
use App\Features\Cms\Models\ContentEntry;
use App\Features\Cms\Models\ContentType;
use App\Features\Cms\Models\Term;
use App\Features\Cms\Support\ContentPresenter;
use App\Http\Controllers\Controller;
use App\Support\Seo\SeoHead;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The public blog: the post list with category and tag filters, single posts, and comments.
 */
class BlogController extends Controller
{
    public function index(Request $request): Response
    {
        $postType = ContentType::findByKey('post') ?? abort(404);

        $term = null;

        if ($request->filled('category') || $request->filled('tag')) {
            $taxonomy = $request->filled('category') ? Term::CATEGORY : Term::TAG;
            $term = Term::query()
                ->where('taxonomy', $taxonomy)
                ->where('slug', (string) $request->input($taxonomy === Term::CATEGORY ? 'category' : 'tag'))
                ->first();
        }

        $posts = ContentEntry::query()
            ->where('content_type', 'post')
            ->live()
            ->when($term, fn ($query) => $query->whereHas('terms', fn ($inner) => $inner->whereKey($term->id)))
            ->orderByDesc('published_at')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('blog/index', [
            'posts' => $posts->through(fn (ContentEntry $post) => ContentPresenter::summary($post)),
            'filter' => $term ? ['taxonomy' => $term->taxonomy, 'name' => $term->name, 'slug' => $term->slug] : null,
            'categories' => $this->terms(Term::CATEGORY),
            'tags' => $this->terms(Term::TAG),
            'type' => ['key' => $postType->key, 'label' => $postType->label],
            'seo' => SeoHead::for(title: $postType->label, canonical: route('blog.index')),
        ]);
    }

    public function show(string $slug): Response
    {
        $post = ContentEntry::query()
            ->where('content_type', 'post')
            ->where('slug', $slug)
            ->live()
            ->first() ?? abort(404);

        $postType = ContentType::findByKey('post') ?? abort(404);

        $post->loadMissing('terms');

        return Inertia::render('blog/show', [
            'entry' => ContentPresenter::page($post, $postType),
            'comments' => $post->comments()->approved()->oldest()->get()->map(fn (Comment $comment) => [
                'id' => $comment->id,
                'author' => $comment->author_name,
                'body' => $comment->body,
                'createdAt' => $comment->created_at?->toIso8601String(),
            ])->values(),
        ]);
    }

    /**
     * A visitor's comment. It waits for approval, and a hidden field catches simple bots.
     */
    public function comment(Request $request, string $slug): RedirectResponse
    {
        $post = ContentEntry::query()
            ->where('content_type', 'post')
            ->where('slug', $slug)
            ->live()
            ->first() ?? abort(404);

        // A bot that fills in the hidden field is turned away without saying why.
        if (filled($request->input('website'))) {
            return back();
        }

        $validated = $request->validate([
            'author_name' => ['required', 'string', 'max:80'],
            'author_email' => ['nullable', 'email', 'max:160'],
            'body' => ['required', 'string', 'max:2000'],
        ]);

        Comment::query()->create([
            'entry_id' => $post->id,
            'author_name' => $validated['author_name'],
            'author_email' => $validated['author_email'] ?? null,
            'body' => $validated['body'],
            'status' => Comment::PENDING,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Thank you. Your comment will appear once it is approved.')]);

        return back();
    }

    /**
     * @return list<array{id: int, name: string, slug: string}>
     */
    private function terms(string $taxonomy): array
    {
        return Term::query()
            ->where('taxonomy', $taxonomy)
            ->whereHas('entries', fn ($query) => $query->where('content_type', 'post')->live())
            ->orderBy('name')
            ->get(['id', 'name', 'slug'])
            ->map(fn (Term $term) => ['id' => $term->id, 'name' => $term->name, 'slug' => $term->slug])
            ->values()
            ->all();
    }
}
