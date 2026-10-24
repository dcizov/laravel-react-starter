<?php

namespace App\Http\Requests\Admin;

use App\Models\Invitation;
use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class InviteUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('users.manage') ?? false;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255'],
            'role' => ['required', 'string', Rule::in(array_keys((array) config('lattice.roles')))],
        ];
    }

    /**
     * @return array<int, callable>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->isNotEmpty()) {
                    return;
                }

                $email = (string) $this->input('email');

                if (User::query()->where('email', $email)->exists()) {
                    $validator->errors()->add('email', 'That person already has an account.');
                }

                if (Invitation::query()
                    ->where('email', $email)
                    ->whereNull('accepted_at')
                    ->where('expires_at', '>', now())
                    ->exists()) {
                    $validator->errors()->add('email', 'A pending invitation already exists for that address.');
                }
            },
        ];
    }
}
