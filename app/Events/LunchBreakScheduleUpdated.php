<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LunchBreakScheduleUpdated
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public User $actor,
        public string $date,
    ) {}
}
