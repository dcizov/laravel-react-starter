<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Cms\Sections\SectionRegistry;
use Illuminate\Foundation\Http\FormRequest;

class StorePageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('pages.create') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'min:2', 'max:160'],
            'slug' => ['nullable', 'string', 'max:160', 'alpha_dash', 'not_in:'.implode(',', (array) config('lattice.reserved_slugs'))],
            'excerpt' => ['nullable', 'string', 'max:400'],
            'seo_title' => ['nullable', 'string', 'max:70'],
            'seo_description' => ['nullable', 'string', 'max:170'],
            'robots' => ['nullable', 'string', 'in:index,follow,index,nofollow,noindex,follow,noindex,nofollow'],
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
