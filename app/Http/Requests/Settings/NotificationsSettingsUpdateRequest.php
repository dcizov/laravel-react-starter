<?php

namespace App\Http\Requests\Settings;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class NotificationsSettingsUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'type' => ['required', 'string', Rule::in(['all', 'mentions', 'none'])],
            'mobile' => ['boolean'],
            'communication_emails' => ['boolean'],
            'social_emails' => ['boolean'],
            'marketing_emails' => ['boolean'],
            'security_emails' => ['boolean'],
        ];
    }
}
