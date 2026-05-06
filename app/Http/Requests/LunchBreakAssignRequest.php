<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LunchBreakAssignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'date' => ['required', 'date_format:Y-m-d'],
            'start_time' => ['required', 'regex:/^\d{2}:(00|30)$/'],
            'user_ids' => ['required', 'array', 'min:1'],
            'user_ids.*' => ['integer', 'min:1'],
        ];
    }

    public function lunchDate(): string
    {
        return (string) $this->input('date');
    }

    public function lunchStartTime(): string
    {
        return (string) $this->input('start_time');
    }

    /**
     * @return array<int, int>
     */
    public function userIds(): array
    {
        /** @var array<int, int|string> $ids */
        $ids = (array) $this->input('user_ids', []);
        return array_values(array_map('intval', $ids));
    }
}

