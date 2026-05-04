<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LunchBreakStartRequest extends FormRequest
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
            'planned_start_time' => ['required', 'regex:/^\d{2}:00$/'],
            'user_id' => ['nullable', 'integer', 'min:1', 'exists:users,id'],
            'reason' => ['required', 'in:on_time,delay_30,delay_60,call,customer,meeting,other'],
            'note' => ['nullable', 'string', 'max:140'],
        ];
    }

    public function lunchDate(): string
    {
        return (string) $this->input('date');
    }

    public function plannedStartTime(): string
    {
        return (string) $this->input('planned_start_time');
    }

    public function targetUserId(): ?int
    {
        $v = $this->input('user_id');
        return $v === null || $v === '' ? null : (int) $v;
    }

    public function reason(): string
    {
        return (string) $this->input('reason');
    }

    public function note(): ?string
    {
        $v = $this->input('note');
        return $v === null || $v === '' ? null : (string) $v;
    }
}

