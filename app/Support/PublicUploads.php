<?php

namespace App\Support;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

/**
 * Saves user uploads to the public disk. A failed write never produces an empty path: store() returns null,
 * and storeOrFail() turns that into a validation error, so nothing reaches the database or the settings.
 */
final class PublicUploads
{
    public const DISK = 'public';

    /**
     * Store the file under a random name in the directory, the same name UploadedFile::store() picks.
     * Returns the stored path, or null when the write failed. A partial file is removed and the failure is logged.
     */
    public static function store(UploadedFile $file, string $directory): ?string
    {
        $disk = Storage::disk(self::DISK);
        $path = $file->hashName($directory);

        $stored = $disk->putFileAs($directory, $file, basename($path));

        if (is_string($stored)) {
            return $stored;
        }

        if ($disk->exists($path)) {
            $disk->delete($path);
        }

        // The context holds only where the file was headed and what it was. Never its contents or its original name.
        Log::error('An uploaded file could not be saved.', [
            'disk' => self::DISK,
            'directory' => $directory,
            'path' => $path,
            'mime_type' => $file->getClientMimeType(),
            'size' => $file->getSize(),
        ]);

        return null;
    }

    /**
     * Store the file, or fail validation on the given field so the form or JSON caller shows the error.
     *
     * @throws ValidationException
     */
    public static function storeOrFail(UploadedFile $file, string $directory, string $field): string
    {
        $path = self::store($file, $directory);

        if ($path === null) {
            throw ValidationException::withMessages([
                $field => __('The file could not be saved. Please try again.'),
            ]);
        }

        return $path;
    }
}
