<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CsvImportCompleted
{
    use Dispatchable;
    use SerializesModels;

    public function __construct(
        public int $uploadId,
        public string $filename,
        public int $successCount,
        public int $failedCount,
        public ?User $actor = null,
    ) {}
}
