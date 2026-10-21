<?php

namespace App\Features\Cms\Http\Requests;

use App\Features\Cms\Models\ContentEntry;
use App\Features\Cms\Models\ContentType;
use App\Features\Cms\Support\SafeUrl;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ContentEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * The content blocks are checked by App\Features\Cms\Support\ContentBlocks in the controller.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        $type = ContentType::findByKey((string) $this->route('type'));

        abort_if($type === null, 404);

        /** @var ContentEntry|null $entry */
        $entry = $this->route('entry');

        $slugUnique = Rule::unique('cms_entries', 'slug')->where('content_type', $type->key);

        if ($entry !== null) {
            $slugUnique->ignore($entry->id);
        }

        return [
            'title' => ['required', 'string', 'max:160'],
            'slug' => ['nullable', 'string', 'max:160', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slugUnique],
            'excerpt' => ['nullable', 'string', 'max:500'],
            'featured_image' => ['nullable', 'string', 'max:500', SafeUrl::rule()],
            'status' => ['required', Rule::in(ContentEntry::STATUSES)],
            'published_at' => ['nullable', 'date'],
            'term_ids' => ['present', 'array'],
            'term_ids.*' => ['integer', 'exists:cms_terms,id'],
            'custom_fields' => ['nullable', 'array'],
            'seo' => ['nullable', 'array'],
            'seo.title' => ['nullable', 'string', 'max:70'],
            'seo.description' => ['nullable', 'string', 'max:180'],
            'seo.noindex' => ['nullable', 'boolean'],
            ...$type->customFieldRules(),
        ];
    }
}
