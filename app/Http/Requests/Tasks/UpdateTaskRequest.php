<?php

namespace App\Http\Requests\Tasks;

use App\Models\Task;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTaskRequest extends FormRequest
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
     * Only the fields that are sent are changed, so a label change can send just the label.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'status' => ['sometimes', 'required', Rule::in(Task::STATUSES)],
            'label' => ['sometimes', 'required', Rule::in(Task::LABELS)],
            'priority' => ['sometimes', 'required', Rule::in(Task::PRIORITIES)],
        ];
    }
}
