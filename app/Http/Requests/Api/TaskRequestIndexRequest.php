<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class TaskRequestIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'type' => ['nullable', 'in:received,sent'],
            'status' => ['nullable', 'in:pending,completed'],
            'priority' => ['nullable', 'in:urgent,important,normal'],
            'sort' => ['nullable', 'in:created_at_desc,created_at_asc'],
        ];
    }

    public function type(): string
    {
        return (string) $this->input('type', 'received');
    }

    public function status(): ?string
    {
        $v = $this->input('status');
        return $v === null || $v === '' ? null : (string) $v;
    }

    public function priority(): ?string
    {
        $v = $this->input('priority');
        return $v === null || $v === '' ? null : (string) $v;
    }

    public function sort(): string
    {
        return (string) $this->input('sort', 'created_at_desc');
    }
}

