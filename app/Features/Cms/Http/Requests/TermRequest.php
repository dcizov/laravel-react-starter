<?php

namespace App\Features\Cms\Http\Requests;

use App\Features\Cms\Models\Term;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TermRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        /** @var Term|null $term */
        $term = $this->route('term');

        // Slugs are unique per content type and taxonomy, so two types can both have a "news" category.
        // A term keeps its content type once created, so its current type is the one to check against.
        $contentType = $term?->content_type ?? (string) $this->input('content_type');

        $slugUnique = Rule::unique('cms_terms', 'slug')
            ->where('content_type', $contentType)
            ->where('taxonomy', (string) $this->input('taxonomy'));

        if ($term !== null) {
            $slugUnique->ignore($term->id);
        }

        return [
            'content_type' => $term === null
                ? ['required', 'string', 'exists:cms_content_types,key']
                : ['prohibited'],
            'taxonomy' => ['required', Rule::in(Term::TAXONOMIES)],
            'name' => ['required', 'string', 'max:80'],
            'slug' => ['nullable', 'string', 'max:80', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slugUnique],
        ];
    }
}
