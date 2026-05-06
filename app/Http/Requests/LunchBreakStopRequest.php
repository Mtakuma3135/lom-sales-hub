<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LunchBreakStopRequest extends FormRequest
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
            'date' => ['required', 'date_format:Y-m-d'],
            'user_id' => ['nullable', 'integer', 'min:1', 'exists:users,id'],
        ];
    }

    public function lunchDate(): string
    {
        return (string) $this->input('date');
    }

    public function targetUserId(): ?int
    {
        $v = $this->input('user_id');
        return $v === null || $v === '' ? null : (int) $v;
    }
}