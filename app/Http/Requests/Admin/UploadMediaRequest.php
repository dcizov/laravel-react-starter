<?php

namespace App\Http\Requests\Admin;

use App\Models\Media;
use Illuminate\Foundation\Http\FormRequest;

class UploadMediaRequest extends FormRequest
{
    /**
     * Twelve megabytes and this MIME list are the ceiling for a plain upload
     * form. Anything looser would let a `.php` file into `storage/app/public`.
     */
    public const MAX_KILOBYTES = 12288;

    public const MIMES = 'jpg,jpeg,png,webp,gif,pdf';

    public function authorize(): bool
    {
        return $this->user()?->can('create', Media::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'files' => ['required', 'array', 'min:1', 'max:10'],
            'files.*' => ['required', 'file', 'max:'.self::MAX_KILOBYTES, 'mimes:'.self::MIMES],
            'folder_id' => ['nullable', 'integer', 'exists:media_folders,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'files.required' => 'Choose at least one file to upload.',
            'files.max' => 'Upload at most 10 files at a time.',
            'files.*.max' => 'Files must be 12 MB or smaller.',
            'files.*.mimes' => 'Only JPG, PNG, WebP, GIF and PDF files are allowed.',
        ];
    }
}
