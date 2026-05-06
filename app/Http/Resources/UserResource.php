<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $dept = $this->resource->relationLoaded('department')
            ? $this->resource->department
            : null;

        return [
            'id' => $this->resource->id,
            'employee_code' => $this->resource->employee_code,
            'name' => $this->resource->name,
            'email' => $this->resource->email,
            'role' => $this->resource->role,
            'is_active' => $this->resource->is_active,
            'department' => $dept ? [
                'id' => (int) $dept->id,
                'name' => (string) $dept->name,
                'code' => (string) $dept->code,
            ] : null,
            'created_at' => optional($this->resource->created_at)->toISOString(),
            'updated_at' => optional($this->resource->updated_at)->toISOString(),
        ];
    }
}

