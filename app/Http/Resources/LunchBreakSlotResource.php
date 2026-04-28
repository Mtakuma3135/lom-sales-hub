<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LunchBreakSlotResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'start_time' => $this->resource['start_time'],
            'end_time' => $this->resource['end_time'],
            'capacity' => $this->resource['capacity'],
            'reservations' => LunchBreakReservationResource::collection($this->resource['reservations']),
        ];
    }
}

