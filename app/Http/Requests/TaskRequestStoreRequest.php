<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TaskRequestStoreRequest extends FormRequest
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
            'title' => ['required', 'string', 'max:100'],
            'to_user_id' => ['required', 'integer', 'min:1', 'exists:users,id'],
            'priority' => ['required', 'in:urgent,important,normal'],
            'body' => ['required', 'string', 'max:2000'],
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
        return (string) $this->input('body');
    }
}

