<?php

namespace App\Http\Requests\Api\Admin;

use Illuminate\Foundation\Http\FormRequest;

class NoticeUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['nullable', 'string', 'max:100'],
            'body' => ['nullable', 'string', 'min:1', 'max:10000'],
            'is_pinned' => ['nullable', 'boolean'],
            'published_at' => ['nullable', 'date_format:Y-m-d H:i:s'],
        ];
    }

    /**
     * @return array{title?:string,body?:string,is_pinned?:bool,published_at?:string|null}
     */
    public function attrs(): array
    {
        $attrs = [];

        if ($this->has('title')) {
            $attrs['title'] = (string) $this->input('title');
        }
        if ($this->has('body')) {
            $attrs['body'] = (string) $this->input('body');
        }
        if ($this->has('is_pinned')) {
            $attrs['is_pinned'] = (bool) $this->boolean('is_pinned');
        }
        if ($this->has('published_at')) {
            $v = $this->input('published_at');
            $attrs['published_at'] = $v === null || $v === '' ? null : (string) $v;
        }

        return $attrs;
    }
}

