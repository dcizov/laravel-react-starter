<?php

namespace App\Features\Blog\Http\Controllers\Public;

use App\Features\Cms\Models\ContentEntry;
use App\Features\Cms\Models\ContentType;
use App\Features\Cms\Support\ContentPresenter;
use App\Features\Cms\Support\EntryListing;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\Seo\SeoHead;
use App\Support\Sites\CurrentSite;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Inertia\Inertia;
use Inertia\Response as InertiaResponse;

/**
 * The public blog: the post list with search, category and tag filters, single posts with their comments, author
 * pages, and an RSS feed. Everything is limited to the current site and to live posts.
 */
class BlogController extends Controller
{
    public function index(Request $request): InertiaResponse
    {
        $postType = ContentType::findByKey('post') ?? abort(404);
        $listing = EntryListing::terms('post', $request);
        $search = trim((string) $request->query('q', ''));

        $posts = EntryListing::search(
            EntryListing::filter(
                ContentEntry::query()->where('content_type', 'post')->live()->with('author'),
                $listing['term'],
            ),
            $search,
        )
            ->orderByDesc('published_at')
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('blog/index', [
            'posts' => $posts->through(fn (ContentEntry $post) => ContentPresenter::summary($post)),
            'filter' => $listing['filter'],
            'search' => $search,
            'categories' => $listing['categories'],
            'tags' => $listing['tags'],
            'type' => ['key' => $postType->key, 'label' => $postType->label],
            'feedUrl' => route('blog.feed'),
            'seo' => SeoHead::for(title: $postType->label, canonical: route('blog.index')),
        ]);
    }

    public function show(string $slug): InertiaResponse
    {
        $post = ContentEntry::query()
            ->where('content_type', 'post')
            ->where('slug', $slug)
            ->live()
            ->with('author')
            ->first() ?? abort(404);

        $postType = ContentType::findByKey('post') ?? abort(404);

        $post->loadMissing('terms');

        return Inertia::render('blog/show', [
            'entry' => ContentPresenter::page($post, $postType),
            'commentsEnabled' => $postType->supports(ContentType::SUPPORT_COMMENTS),
            'comments' => $postType->supports(ContentType::SUPPORT_COMMENTS) ? EntryListing::approvedComments($post) : [],
        ]);
    }

    /**
     * The posts of one author on this site. An author with no live posts here has no page.
     */
    public function author(int $author): InertiaResponse
    {
        $user = User::query()->whereKey($author)->whereNull('suspended_at')->first() ?? abort(404);

        $query = ContentEntry::query()
            ->where('content_type', 'post')
            ->where('author_id', $user->getKey())
            ->live();

        abort_if((clone $query)->doesntExist(), 404);

        $posts = $query->with('author')->orderByDesc('published_at')->paginate(12)->withQueryString();

        return Inertia::render('blog/author', [
            'author' => ['id' => $user->id, 'name' => $user->name],
            'posts' => $posts->through(fn (ContentEntry $post) => ContentPresenter::summary($post)),
            'seo' => SeoHead::for(
                title: $user->name,
                description: __('Posts by :name', ['name' => $user->name]),
                canonical: route('blog.author', $user->id),
            ),
        ]);
    }

    /**
     * RSS 2.0 for the site's newest live posts. Built by hand, the same way as the sitemap, so no package is needed.
     */
    public function feed(): Response
    {
        $site = app(CurrentSite::class)->site();
        $posts = ContentEntry::query()
            ->where('content_type', 'post')
            ->live()
            ->with('author')
            ->orderByDesc('published_at')
            ->limit(20)
            ->get();

        $items = '';

        foreach ($posts as $post) {
            $items .= "    <item>\n"
                .'      <title>'.e($post->title)."</title>\n"
                .'      <link>'.e(ContentPresenter::url($post))."</link>\n"
                .'      <guid isPermaLink="true">'.e(ContentPresenter::url($post))."</guid>\n"
                .'      <description>'.e((string) $post->excerpt)."</description>\n"
                .($post->published_at ? '      <pubDate>'.$post->published_at->toRfc2822String()."</pubDate>\n" : '')
                .($post->author instanceof User ? '      <author>'.e($post->author->name)."</author>\n" : '')
                ."    </item>\n";
        }

        $body = '<?xml version="1.0" encoding="UTF-8"?>'."\n"
            .'<rss version="2.0"><channel>'."\n"
            .'  <title>'.e($site->name).' — '.e(__('Blog'))."</title>\n"
            .'  <link>'.e(route('blog.index'))."</link>\n"
            .'  <description>'.e((string) ($site->description() ?? $site->name))."</description>\n"
            .'  <language>'.e($site->locale)."</language>\n"
            .$items
            .'</channel></rss>'."\n";

        return response($body, 200, ['Content-Type' => 'application/rss+xml; charset=UTF-8']);
    }
}
