<?php

namespace App\Features\Blog\Http\Controllers\Public;

use App\Features\Cms\Models\ContentEntry;
use App\Features\Cms\Models\ContentType;
use App\Features\Cms\Support\ContentPresenter;
use App\Features\Cms\Support\EntryListing;
use App\Http\Controllers\Controller;
use App\Support\Seo\SeoHead;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * The public blog: the post list with category and tag filters, and single posts with their comments.
 * Comments are the cms feature's, so they work the same way on any type that has the comments support.
 */
class BlogController extends Controller
{
    public function index(Request $request): Response
    {
        $postType = ContentType::findByKey('post') ?? abort(404);
        $listing = EntryListing::terms('post', $request);

        $posts = EntryListing::filter(
            ContentEntry::query()->where('content_type', 'post')->live(),
            $listing['term'],
        )
            ->orderByDesc('published_at')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('blog/index', [
            'posts' => $posts->through(fn (ContentEntry $post) => ContentPresenter::summary($post)),
            'filter' => $listing['filter'],
            'categories' => $listing['categories'],
            'tags' => $listing['tags'],
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
            'commentsEnabled' => $postType->supports(ContentType::SUPPORT_COMMENTS),
            'comments' => $postType->supports(ContentType::SUPPORT_COMMENTS) ? EntryListing::approvedComments($post) : [],
        ]);
    }
}
