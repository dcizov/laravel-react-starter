<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Media;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

/**
 * Documents are streamed through the application instead of being served as
 * static files from `/storage`.
 *
 * The public disk makes every upload reachable at a stable URL, which is fine
 * for images but means a PDF is rendered by the browser's viewer on the app
 * origin. Serving it here forces a download, pins the content type and adds
 * `nosniff`, so an uploaded document cannot be interpreted as a page.
 */
class MediaDownloadController extends Controller
{
    public function __invoke(Request $request, Media $media): StreamedResponse
    {
        abort_unless($media->type !== 'image', 404);

        $disk = Storage::disk($media->disk);

        abort_unless($disk->exists($media->path), 404);

        return $disk->download(
            $media->path,
            $media->original_name,
            [
                'Content-Type' => $media->mime,
                'X-Content-Type-Options' => 'nosniff',
                'Content-Security-Policy' => "default-src 'none'; sandbox",
            ],
        );
    }
}
