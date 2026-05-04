<?php

namespace App\Jobs;

use App\Models\CsvUpload;
use App\Services\GasWebhookService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendCsvToGasJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public $tries = 3;

    public $backoff = 60;

    public function __construct(
        public int $uploadId,
        public string $filename,
        public int $successCount,
        public int $failedCount,
    ) {
    }

    public function handle(GasWebhookService $gasWebhook): void
    {
        $payload = [
            'upload_id' => $this->uploadId,
            'filename' => $this->filename,
            'success_count' => $this->successCount,
            'failed_count' => $this->failedCount,
            'sent_at' => now()->toISOString(),
            'timestamp' => now()->timestamp,
        ];

        $result = $gasWebhook->post(
            $payload,
            'csv_upload_summary',
            CsvUpload::class,
            $this->uploadId,
        );

        if ($result === 'skipped') {
            Log::info('SendCsvToGasJob skipped (no dummy url)', [
                'upload_id' => $this->uploadId,
                'filename' => $this->filename,
            ]);
        }
    }
}
