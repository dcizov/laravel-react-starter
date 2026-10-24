<?php

namespace App\Http\Requests\Admin;

use App\Models\Media;
use App\Models\MediaFolder;
use Closure;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class MediaFolderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('manageFolders', Media::class) ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $folder = $this->route('folder');
        $parentId = $this->input('parent_id');

        return [
            'name' => [
                'required', 'string', 'min:1', 'max:60',
                // Sibling folders are compared by slug, because that is what
                // the tree orders and dedupes on.
                function (string $attribute, mixed $value, Closure $fail) use ($parentId, $folder): void {
                    $clash = MediaFolder::query()
                        ->where('parent_id', $parentId)
                        ->where('slug', Str::slug((string) $value))
                        ->when($folder !== null, fn ($query) => $query->whereKeyNot($folder->id))
                        ->exists();

                    if ($clash) {
                        $fail('A folder with that name already exists here.');
                    }
                },
            ],
            'parent_id' => [
                'nullable', 'integer', 'exists:media_folders,id',
                // A folder can never become its own ancestor.
                $folder === null ? 'nullable' : Rule::notIn([$folder->id]),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'parent_id.not_in' => 'A folder cannot be moved inside itself.',
        ];
    }
}
