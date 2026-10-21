<?php

namespace App\Features\Cms\Http\Requests;

use App\Features\Cms\Models\ContentType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ContentTypeRequest extends FormRequest
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
        // The key is the public URL segment, so it can only be set when the type is created.
        return [
            'key' => $this->isMethod('post') ? ContentType::keyRules() : [],
            'label' => ['required', 'string', 'max:80'],
            'singular_label' => ['required', 'string', 'max:80'],
            'has_archive' => ['boolean'],
            'supports' => ['present', 'array'],
            'supports.*' => ['string', Rule::in(ContentType::SUPPORTS)],
            'fields' => ['present', 'array', 'max:20'],
            'fields.*.key' => ['required', 'string', 'regex:/^[a-z][a-z0-9_]{1,39}$/', 'distinct'],
            'fields.*.label' => ['required', 'string', 'max:80'],
            'fields.*.type' => ['required', Rule::in(ContentType::FIELD_TYPES)],
        ];
    }
}
