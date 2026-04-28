<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property array{id:int,filename:string,success_count:int,failed_count:int,created_at:string} $resource
 */
class CsvUploadHistoryResource extends JsonResource
{
    /**
     * @return array{id:int,filename:string,success_count:int,failed_count:int,created_at:string}
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => (int) ($this->resource['id'] ?? 0),
            'filename' => (string) ($this->resource['filename'] ?? ''),
            'success_count' => (int) ($this->resource['success_count'] ?? 0),
            'failed_count' => (int) ($this->resource['failed_count'] ?? 0),
            'created_at' => (string) ($this->resource['created_at'] ?? ''),
        ];
    }
}

