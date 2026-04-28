<?php

namespace App\Http\Requests\Api\Admin;

use Illuminate\Foundation\Http\FormRequest;

class ProductUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'talk_script' => ['nullable', 'string', 'max:10000'],
            'manual_url' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array{talk_script?:string,manual_url?:string}
     */
    public function attrs(): array
    {
        $attrs = [];
        if ($this->has('talk_script')) {
            $attrs['talk_script'] = (string) $this->input('talk_script');
        }
        if ($this->has('manual_url')) {
            $attrs['manual_url'] = (string) $this->input('manual_url');
        }
        return $attrs;
    }
}

