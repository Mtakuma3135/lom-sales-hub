<?php

namespace App\Http\Requests\Api\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UserUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $userId = (int) $this->route('id');

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'employee_code' => ['sometimes', 'required', 'string', 'max:255', Rule::unique('users', 'employee_code')->ignore($userId)],
            'email' => ['sometimes', 'nullable', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($userId)],
            'password' => ['sometimes', 'nullable', 'string', 'min:8', 'max:255'],
            'role' => ['sometimes', 'in:admin,general'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if ($this->exists('email') && $this->input('email') === '') {
            $this->merge(['email' => null]);
        }
        if ($this->input('password') === '') {
            $this->merge(['password' => null]);
        }
    }
}
