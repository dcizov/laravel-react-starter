<?php

namespace App\Features\Cms\Http\Requests;

use App\Features\Cms\Support\SafeUrl;
use Illuminate\Foundation\Http\FormRequest;

class CtaRequest extends FormRequest
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
        return [
            'name' => ['required', 'string', 'max:120'],
            'heading' => ['required', 'string', 'max:160'],
            'text' => ['nullable', 'string', 'max:300'],
            'button_label' => ['nullable', 'string', 'max:40'],
            'button_url' => ['nullable', 'string', 'max:500', SafeUrl::rule()],
        ];
    }
}
