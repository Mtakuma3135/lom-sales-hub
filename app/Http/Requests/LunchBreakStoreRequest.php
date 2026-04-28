<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LunchBreakStoreRequest extends FormRequest
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
            'start_time' => ['required', 'regex:/^\d{2}:(00|30)$/'],
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
}

