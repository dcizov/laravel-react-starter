<?php

namespace App\Http\Requests\Settings;

use App\Support\Locales;
use App\Support\Timezones;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AccountSettingsUpdateRequest extends FormRequest
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
            'date_of_birth' => ['nullable', 'date', 'before:today'],
            'locale' => ['required', 'string', Rule::in(Locales::codes())],
            'timezone' => ['nullable', 'string', Rule::in(Timezones::ZONES)],
        ];
    }
}
