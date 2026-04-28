<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;

class SalesRecordIndexRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'page' => ['nullable', 'integer', 'min:1'],
            'keyword' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:ok,ng'],
            'date_from' => ['nullable', 'date_format:Y-m-d'],
            'date_to' => ['nullable', 'date_format:Y-m-d'],
        ];
    }

    /**
     * @return array{page?:int,keyword?:string,status?:string,date_from?:string,date_to?:string}
     */
    public function queryParams(): array
    {
        return array_filter([
            'page' => $this->input('page') !== null ? (int) $this->input('page') : null,
            'keyword' => $this->input('keyword') !== null ? (string) $this->input('keyword') : null,
            'status' => $this->input('status') !== null ? (string) $this->input('status') : null,
            'date_from' => $this->input('date_from') !== null ? (string) $this->input('date_from') : null,
            'date_to' => $this->input('date_to') !== null ? (string) $this->input('date_to') : null,
        ], fn ($v) => $v !== null && $v !== '');
    }
}

