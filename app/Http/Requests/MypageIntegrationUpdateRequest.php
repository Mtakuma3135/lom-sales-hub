<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MypageIntegrationUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'kot_personal_api_token' => ['nullable', 'string', 'max:512'],
            'personal_discord_webhook_url' => ['nullable', 'string', 'max:2048'],
            'clear_kot_personal' => ['sometimes', 'boolean'],
            'clear_discord_personal' => ['sometimes', 'boolean'],
            'extra_integrations' => ['nullable', 'array', 'max:8'],
            'extra_integrations.*.label' => ['required_with:extra_integrations', 'string', 'max:120'],
            'extra_integrations.*.token_label' => ['required_with:extra_integrations', 'string', 'max:120'],
            'extra_integrations.*.token_value' => ['required_with:extra_integrations', 'string', 'max:4000'],
        ];
    }

    public function messages(): array
    {
        return [
            'personal_discord_webhook_url.max' => 'Discord Webhook URL が長すぎます。',
            'kot_personal_api_token.max' => 'KOT の API トークンが長すぎます。',
        ];
    }
}
