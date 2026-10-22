<?php

namespace App\Http\Requests\Admin;

use App\Features\Cms\Models\ContentEntry;
use App\Models\Scopes\SiteScope;
use App\Models\Site;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class SiteRequest extends FormRequest
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
        /** @var Site|null $site */
        $site = $this->route('site');

        $slugUnique = Rule::unique('sites', 'slug');
        $domainUnique = Rule::unique('sites', 'domain');

        if ($site !== null) {
            $slugUnique->ignore($site->id);
            $domainUnique->ignore($site->id);
        }

        return [
            'name' => ['required', 'string', 'max:120'],
            'slug' => [
                'required',
                'string',
                'max:40',
                'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/',
                Rule::notIn(Site::RESERVED_SLUGS),
                $slugUnique,
            ],
            // The host name that serves the site. Empty means the site is reached through /s/{slug}.
            'domain' => [
                'nullable',
                'string',
                'max:190',
                'regex:/^(?=.{1,190}$)[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$/',
                $domainUnique,
            ],
            'locale' => ['required', Rule::in(Site::LOCALES)],
            'description' => ['nullable', 'string', 'max:255'],
            'home_slug' => ['nullable', 'string', 'max:160', 'regex:/^[a-z0-9]+(?:-[a-z0-9]+)*$/'],
            // Set when the site should become the default. The default site cannot be unset, only replaced.
            'is_default' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * The home page must be a page of the same site, so the site never points at another site's content.
     *
     * @return list<\Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $slug = $this->input('home_slug');

                if (! filled($slug)) {
                    return;
                }

                /** @var Site|null $site */
                $site = $this->route('site');

                $exists = ContentEntry::query()
                    ->withoutGlobalScope(SiteScope::class)
                    ->where('site_id', $site === null ? 0 : $site->id)
                    ->where('content_type', 'page')
                    ->where('slug', $slug)
                    ->exists();

                if (! $exists) {
                    $validator->errors()->add('home_slug', __('The home page must be a page of this site.'));
                }
            },
        ];
    }
}
