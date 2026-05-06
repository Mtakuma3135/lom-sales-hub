<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class LunchBreakGridSyncRequest extends FormRequest
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
            'cells' => ['required', 'array', 'min:1'],
            'cells.*.time' => ['required', 'regex:/^\d{2}:\d{2}$/'],
            'cells.*.lane' => ['required', 'integer', 'between:1,5'],
            'cells.*.user_id' => ['nullable', 'integer', 'exists:users,id'],
        ];
    }

    public function lunchDate(): string
    {
        return (string) $this->input('date');
    }

    /**
     * @return array<int, array{time:string,lane:int,user_id?:int|null}>
     */
    public function cells(): array
    {
        /** @var array<int, array<string, mixed>> $raw */
        $raw = (array) $this->input('cells', []);

        return array_values(array_map(function (array $c) {
            return [
                'time' => (string) ($c['time'] ?? ''),
                'lane' => (int) ($c['lane'] ?? 0),
                'user_id' => array_key_exists('user_id', $c) && $c['user_id'] !== null && $c['user_id'] !== ''
                    ? (int) $c['user_id']
                    : null,
            ];
        }, $raw));
    }
}
