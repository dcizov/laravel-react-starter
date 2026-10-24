<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMediaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('media')) ?? false;
    }

    /**
     * Only metadata changes here. Replacing the bytes is a new upload, not an
     * edit — that keeps usage rows and CDN caches honest.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'alt' => ['sometimes', 'nullable', 'string', 'max:255'],
            'caption' => ['sometimes', 'nullable', 'string', 'max:500'],
            'folder_id' => ['sometimes', 'nullable', 'integer', 'exists:media_folders,id'],
        ];
    }
}
