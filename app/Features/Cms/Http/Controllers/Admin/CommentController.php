<?php

namespace App\Features\Cms\Http\Controllers\Admin;

use App\Features\Cms\Models\Comment;
use App\Features\Cms\Models\ContentType;
use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Comment moderation for every content type with the comments support: approve, mark as spam, or delete.
 * Only comments on entries of the current site are listed or changed.
 */
class CommentController extends Controller
{
    private const PER_PAGE = [10, 20, 30, 50];

    private const SORTS = ['created_at', 'author_name'];

    public function index(Request $request): Response
    {
        $status = in_array($request->query('status'), Comment::STATUSES, true) ? $request->query('status') : Comment::PENDING;
        // Several content types can be chosen at once, as a comma-separated list.
        $types = array_values(array_filter(explode(',', (string) $request->query('type', ''))));
        $search = trim((string) $request->query('q', ''));
        $perPage = in_array((int) $request->query('per_page'), self::PER_PAGE, true) ? (int) $request->query('per_page') : 20;
        $sort = in_array($request->query('sort'), self::SORTS, true) ? $request->query('sort') : 'created_at';
        $direction = $request->query('direction') === 'asc' ? 'asc' : 'desc';

        $comments = $this->siteComments()
            ->with('entry:id,title,slug,content_type')
            ->where('status', $status)
            ->when($types !== [], fn (Builder $query) => $query->whereHas('entry', fn (Builder $inner) => $inner->whereIn('content_type', $types)))
            ->when($search !== '', fn (Builder $query) => $query->where(fn (Builder $inner) => $inner
                ->whereLike('author_name', '%'.addcslashes($search, '\\%_').'%', caseSensitive: false)
                ->orWhereLike('body', '%'.addcslashes($search, '\\%_').'%', caseSensitive: false)))
            ->orderBy($sort, $direction)
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('admin/blog/comments/index', [
            'status' => $status,
            'type' => implode(',', $types),
            'query' => [
                'q' => $search,
                'status' => $status,
                'type' => implode(',', $types),
                'sort' => $sort,
                'direction' => $direction,
                'per_page' => $perPage,
                'page' => $comments->currentPage(),
            ],
            'pageSizes' => self::PER_PAGE,
            // Only the types that accept comments, so the filter lists what can actually have them.
            'types' => ContentType::query()->get(['key', 'label', 'supports'])
                ->filter(fn (ContentType $contentType) => $contentType->supports(ContentType::SUPPORT_COMMENTS))
                ->map(fn (ContentType $contentType) => ['key' => $contentType->key, 'label' => $contentType->label])
                ->values(),
            'counts' => collect(Comment::STATUSES)->mapWithKeys(fn (string $name) => [
                $name => $this->siteComments()->where('status', $name)->count(),
            ]),
            'comments' => $comments->through(fn (Comment $comment) => [
                'id' => $comment->id,
                'author' => $comment->author_name,
                'email' => $comment->author_email,
                'body' => $comment->body,
                'status' => $comment->status,
                'createdAt' => $comment->created_at?->toIso8601String(),
                'entry' => $comment->entry ? [
                    'title' => $comment->entry->title,
                    'slug' => $comment->entry->slug,
                    'type' => $comment->entry->content_type,
                ] : null,
            ]),
        ]);
    }

    /**
     * Approves, marks as spam, or deletes several comments from the list. Only comments on this site are changed.
     */
    public function bulk(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1', 'max:200'],
            'ids.*' => ['integer'],
            'status' => ['required', 'in:'.implode(',', [...Comment::STATUSES, 'delete'])],
        ]);

        $ids = $this->siteComments()->whereIn('id', $validated['ids'])->pluck('id');

        if ($validated['status'] === 'delete') {
            Comment::query()->whereIn('id', $ids)->delete();
        } else {
            Comment::query()->whereIn('id', $ids)->update(['status' => $validated['status']]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __(':count comments updated.', ['count' => $ids->count()])]);

        return back();
    }

    public function update(Request $request, Comment $comment): RedirectResponse
    {
        $this->ensureOnThisSite($comment);

        $validated = $request->validate([
            'status' => ['required', 'in:'.implode(',', Comment::STATUSES)],
        ]);

        $comment->update(['status' => $validated['status']]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Comment updated.')]);

        return back();
    }

    public function destroy(Comment $comment): RedirectResponse
    {
        $this->ensureOnThisSite($comment);

        $comment->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Comment deleted.')]);

        return back();
    }

    /**
     * Comments whose entry is on the current site. The entry's own site scope applies through whereHas.
     *
     * @return Builder<Comment>
     */
    private function siteComments(): Builder
    {
        return Comment::query()->whereHas('entry');
    }

    private function ensureOnThisSite(Comment $comment): void
    {
        abort_unless($this->siteComments()->whereKey($comment->getKey())->exists(), 404);
    }
}
