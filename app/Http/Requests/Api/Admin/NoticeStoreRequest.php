<?php

namespace App\Http\Requests\Api\Admin;

use Illuminate\Foundation\Http\FormRequest;

class NoticeStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:100'],
            'body' => ['required', 'string', 'min:1', 'max:10000'],
            'is_pinned' => ['nullable', 'boolean'],
            'published_at' => ['nullable', 'date_format:Y-m-d H:i:s'],
        ];
    }

    public function title(): string
    {
        return (string) $this->input('title');
    }

    public function body(): string
    {
        return (string) $this->input('body');
    }

    public function isPinned(): bool
    {
        return (bool) $this->boolean('is_pinned');
    }

    public function publishedAt(): ?string
    {
        $v = $this->input('published_at');
        return $v === null || $v === '' ? null : (string) $v;
    }
}

