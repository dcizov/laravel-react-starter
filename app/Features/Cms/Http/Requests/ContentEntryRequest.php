<?php

namespace App\Features\Cms\Http\Requests;

use App\Features\Cms\Models\ContentEntry;
use App\Features\Cms\Models\ContentType;
use App\Features\Cms\Support\SafeUrl;
use App\Support\Sites\CurrentSite;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

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

        $siteId = app(CurrentSite::class)->id();

        // Slugs are unique per site and content type. Trashed entries still count, because they still hold the slug.
        $slugUnique = Rule::unique('cms_entries', 'slug')
            ->where('content_type', $type->key)
            ->where('site_id', $siteId);

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
            'term_ids.*' => ['integer', Rule::exists('cms_terms', 'id')->where('site_id', $siteId)],
            'custom_fields' => ['nullable', 'array'],
            'seo' => ['nullable', 'array'],
            'seo.title' => ['nullable', 'string', 'max:70'],
            'seo.description' => ['nullable', 'string', 'max:180'],
            'seo.noindex' => ['nullable', 'boolean'],
            ...$type->customFieldRules(),
        ];
    }

    /**
     * Publishing and unpublishing need content.publish. Authors can still edit a live entry; its status stays as it is.
     *
     * @return list<\Closure(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                /** @var ContentEntry|null $entry */
                $entry = $this->route('entry');

                $wasLive = $entry?->status === ContentEntry::STATUS_PUBLISHED;
                $becomesLive = $this->input('status') === ContentEntry::STATUS_PUBLISHED;

                if ($wasLive === $becomesLive) {
                    return;
                }

                if (! $this->user()?->can('publish', ContentEntry::class)) {
                    $validator->errors()->add('status', __('You do not have permission to publish or unpublish content.'));
                }
            },
        ];
    }
}
