<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Cms\Settings\SettingSchema;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Rules come from the schema, not from this class: a new setting is validated
 * the moment it is declared, and a partial save (one switch) is valid.
 */
class UpdateSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return (bool) $this->user()?->can('settings.update');
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return SettingSchema::rules((string) $this->route('group'), $this->all());
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'required' => 'The :attribute cannot be empty.',
        ];
    }
}
