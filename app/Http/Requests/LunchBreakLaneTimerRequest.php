<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LunchBreakLaneTimerRequest extends FormRequest
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
            'lane' => ['required', 'integer', 'between:1,5'],
        ];
    }

    public function lunchDate(): string
    {
        return (string) $this->input('date');
    }

    public function lane(): int
    {
        return (int) $this->input('lane');
    }
}

