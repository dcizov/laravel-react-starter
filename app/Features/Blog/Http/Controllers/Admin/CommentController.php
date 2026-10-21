<?php

namespace App\Features\Blog\Http\Controllers\Admin;

use App\Features\Blog\Models\Comment;
use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

/**
 * Comment moderation: approve, mark as spam, or delete.
 */
class CommentController extends Controller
{
    public function index(Request $request): Response
    {
        $status = in_array($request->input('status'), Comment::STATUSES, true) ? $request->input('status') : Comment::PENDING;

        $comments = Comment::query()
            ->with('entry:id,title,slug')
            ->where('status', $status)
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/blog/comments/index', [
            'status' => $status,
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
                'post' => $comment->entry ? ['title' => $comment->entry->title, 'slug' => $comment->entry->slug] : null,
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
