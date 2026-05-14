<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class TaskRequestStoreRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:100'],
            'to_user_id' => ['required', 'integer', 'min:1', 'exists:users,id'],
            'priority' => ['required', 'in:urgent,important,normal'],
            'body' => ['nullable', 'string', 'max:2000'],
            'due_date' => ['nullable', 'date'],
        ];
    }

    public function title(): string
    {
        return (string) $this->input('title');
    }

    public function toUserId(): int
    {
        return (int) $this->input('to_user_id');
    }

    public function priority(): string
    {
        return (string) $this->input('priority');
    }

    public function body(): string
    {
        return (string) ($this->input('body') ?? '');
    }

    public function dueDate(): ?string
    {
        $v = $this->input('due_date');

        return $v === null || $v === '' ? null : (string) $v;
    }
}
