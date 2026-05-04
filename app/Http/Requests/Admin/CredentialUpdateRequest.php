<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;

class CredentialUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'login_id' => ['nullable', 'string', 'max:500'],
            'password' => ['required', 'string', 'max:4000'],
            'updated_at' => ['required', 'date_format:Y-m-d H:i:s'],
        ];
    }

    public function loginId(): string
    {
        return (string) $this->input('login_id', '');
    }

    public function password(): string
    {
        return (string) $this->input('password', '');
    }

    public function updatedAt(): string
    {
        return (string) $this->input('updated_at');
    }
}
