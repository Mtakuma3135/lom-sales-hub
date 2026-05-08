<?php

namespace App\Http\Requests\Admin;

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
            'name' => ['sometimes', 'string', 'max:200'],
            'category' => ['sometimes', 'string', 'max:100'],
            'price' => ['sometimes', 'integer', 'min:0', 'max:100000000'],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    /**
     * @return array<string, mixed>
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
        if ($this->has('name')) {
            $attrs['name'] = (string) $this->input('name');
        }
        if ($this->has('category')) {
            $attrs['category'] = (string) $this->input('category');
        }
        if ($this->has('price')) {
            $attrs['price'] = (int) $this->input('price');
        }
        if ($this->has('is_active')) {
            $attrs['is_active'] = (bool) $this->boolean('is_active');
        }

        return $attrs;
    }
}
