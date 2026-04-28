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
            'value' => ['required', 'string', 'max:500'],
            'updated_at' => ['required', 'date_format:Y-m-d H:i:s'],
        ];
    }

    public function value(): string
    {
        return (string) $this->input('value');
    }

    public function updatedAt(): string
    {
        return (string) $this->input('updated_at');
    }
}

