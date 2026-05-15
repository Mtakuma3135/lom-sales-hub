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
            'body' => ['nullable', 'string', 'max:2000'],
            'due_date' => ['nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required' => 'タイトルは必須です。',
            'title.max' => 'タイトルは100文字以内で入力してください。',
            'to_user_id.required' => '依頼先ユーザーを選択してください。',
            'to_user_id.exists' => '選択したユーザーが存在しません。',
            'priority.required' => '優先度を選択してください。',
            'priority.in' => '優先度の値が不正です。',
            'body.max' => '内容は2000文字以内で入力してください。',
            'due_date.date' => '期日は正しい日付形式で入力してください。',
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
