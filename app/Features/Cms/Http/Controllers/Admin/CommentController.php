<?php

namespace App\Features\Cms\Http\Controllers\Admin;

use App\Features\Cms\Models\Comment;
use App\Features\Cms\Models\ContentEntry;
use App\Features\Cms\Models\ContentType;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Comment moderation for every content type with the comments support: approve, mark as spam, or delete.
 */
class CommentController extends Controller
{
    public function index(Request $request): Response
    {
        $status = in_array($request->input('status'), Comment::STATUSES, true) ? $request->input('status') : Comment::PENDING;
        $type = $request->input('type');

        $comments = Comment::query()
            ->with('entry:id,title,slug,content_type')
            ->where('status', $status)
            ->when($type, fn ($query) => $query->whereHas('entry', fn ($inner) => $inner->where('content_type', $type)))
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/blog/comments/index', [
            'status' => $status,
            'type' => $type,
            // Only the types that accept comments, so the filter lists what can actually have them.
            'types' => ContentType::query()->get(['key', 'label', 'supports'])
                ->filter(fn (ContentType $contentType) => $contentType->supports(ContentType::SUPPORT_COMMENTS))
                ->map(fn (ContentType $contentType) => ['key' => $contentType->key, 'label' => $contentType->label])
                ->values(),
            'counts' => collect(Comment::STATUSES)->mapWithKeys(fn (string $name) => [
                $name => Comment::query()->where('status', $name)->count(),
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

    public function update(Request $request, Comment $comment): RedirectResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:'.implode(',', Comment::STATUSES)],
        ]);

        $comment->update(['status' => $validated['status']]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Comment updated.')]);

        return back();
    }

    public function destroy(Comment $comment): RedirectResponse
    {
        $comment->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Comment deleted.')]);

        return back();
    }
}
