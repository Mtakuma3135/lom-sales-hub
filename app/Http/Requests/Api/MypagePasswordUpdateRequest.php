<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class MypagePasswordUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'current_password' => ['required', 'current_password'],
            'new_password' => [
                'required',
                'string',
                'different:current_password',
                Password::min(8)->mixedCase()->numbers(),
            ],
            'new_password_confirmation' => ['required', 'same:new_password'],
        ];
    }

    public function newPassword(): string
    {
        return (string) $this->input('new_password');
    }
}

