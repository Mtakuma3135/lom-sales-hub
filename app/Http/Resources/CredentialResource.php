<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property array{id:int,label:string,value:string,is_password:bool,updated_at:string} $resource
 */
class CredentialResource extends JsonResource
{
    /**
     * @return array{id:int,label:string,value:string,masked_value:string,is_password:bool,updated_at:string}
     */
    public function toArray(Request $request): array
    {
        $value = (string) ($this->resource['value'] ?? '');
        $isPassword = (bool) ($this->resource['is_password'] ?? false);

        return [
            'id' => (int) ($this->resource['id'] ?? 0),
            'label' => (string) ($this->resource['label'] ?? ''),
            'value' => $isPassword ? '••••••••' : $value,
            'masked_value' => $isPassword ? '••••••••' : $value,
            'is_password' => $isPassword,
            'updated_at' => (string) ($this->resource['updated_at'] ?? ''),
        ];
    }
}

