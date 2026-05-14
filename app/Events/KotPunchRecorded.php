<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class KotPunchRecorded
{
    use Dispatchable;
    use SerializesModels;

    /**
     * @param  'success'|'skipped'|'duplicate'  $outcome
     */
    public function __construct(
        public User $user,
        public string $outcome,
        public string $atIso,
        public ?int $httpStatus = null,
    ) {}
}
