<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class TaskRequestUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function isMetaUpdate(): bool
    {
        return $this->hasAny(['title', 'body', 'priority', 'due_date']);
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        if ($this->isMetaUpdate()) {
            return [
                'title' => ['required', 'string', 'max:500'],
                'body' => ['nullable', 'string', 'max:2000'],
                'priority' => ['required', 'in:urgent,important,normal'],
                'due_date' => ['nullable', 'date'],
                'status' => ['sometimes', 'in:pending,in_progress,completed,rejected'],
            ];
        }

        return [
            'status' => ['required', 'in:pending,in_progress,completed,rejected'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'タイトルは必須です。',
            'title.max' => 'タイトルは500文字以内で入力してください。',
            'priority.required' => '優先度を選択してください。',
            'priority.in' => '優先度の値が不正です。',
            'status.required' => 'ステータスを選択してください。',
            'status.in' => 'ステータスの値が不正です。',
            'body.max' => '内容は2000文字以内で入力してください。',
            'due_date.date' => '期日は正しい日付形式で入力してください。',
        ];
    }

    public function status(): string
    {
        return (string) $this->input('status');
    }

    public function metaTitle(): string
    {
        return (string) $this->input('title');
    }

    public function metaBody(): string
    {
        return (string) ($this->input('body') ?? '');
    }

    public function metaPriority(): string
    {
        return (string) $this->input('priority');
    }

    public function metaDueDate(): ?string
    {
        $v = $this->input('due_date');

        return $v === null || $v === '' ? null : (string) $v;
    }
}
