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

        $slugUnique = Rule::unique('cms_terms', 'slug')->where('taxonomy', (string) $this->input('taxonomy'));

        if ($term !== null) {
            $slugUnique->ignore($term->id);
        }

        return [
            'taxonomy' => ['required', Rule::in(Term::TAXONOMIES)],
            'name' => ['required', 'string', 'max:80'],
            'slug' => ['nullable', 'string', 'max:80', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $slugUnique],
        ];
    }
}
