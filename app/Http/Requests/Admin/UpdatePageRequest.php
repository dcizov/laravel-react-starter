<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Cms\Sections\SectionRegistry;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class UpdatePageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('page')) ?? false;
    }

    /**
     * The section registry supplies the content rules, so the editor's schema
     * and the server's validation can never drift apart.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $registry = app(SectionRegistry::class);

        return array_merge([
            'title' => ['sometimes', 'string', 'min:2', 'max:160'],
            'slug' => ['sometimes', 'nullable', 'string', 'max:160', 'alpha_dash', 'not_in:'.implode(',', (array) config('lattice.reserved_slugs'))],
            'excerpt' => ['sometimes', 'nullable', 'string', 'max:400'],
            'seo_title' => ['sometimes', 'nullable', 'string', 'max:70'],
            'seo_description' => ['sometimes', 'nullable', 'string', 'max:170'],
            'robots' => ['sometimes', 'string', 'in:index,follow,index,nofollow,noindex,follow,noindex,nofollow'],
            'template' => ['sometimes', 'string', 'in:page,landing'],
            // The version the editor loaded. Optional so the API stays usable
            // without it, but the editor always sends it.
            'base_version' => ['sometimes', 'nullable', 'integer', 'min:0'],
        ], $registry->rules()['rules']);
    }

    /**
     * Section field rules run on the normalised tree: a block whose section is
     * unknown is dropped by the registry rather than failing validation.
     *
     * @return list<callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($this->has('content')) {
                    app(SectionRegistry::class)->validate($validator, $this->input('content'));
                }
            },
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return app(SectionRegistry::class)->rules()['attributes'];
    }
}
