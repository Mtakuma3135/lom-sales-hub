<?php

namespace App\Jobs;

use App\Concerns\AuditLoggable;
use App\Models\CsvUpload;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SendCsvToGasJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;
    use AuditLoggable;

    public $tries = 3;

    public $backoff = 60;

    public function __construct(
        public int $uploadId,
        public string $filename,
        public int $successCount,
        public int $failedCount,
    ) {
    }

    public function handle(): void
    {
        $url = (string) config('services.gas.dummy_url', '');
        if ($url === '') {
            Log::info('SendCsvToGasJob skipped (no dummy url)', [
                'upload_id' => $this->uploadId,
                'filename' => $this->filename,
            ]);

            $this->auditLog(
                integration: 'gas',
                eventType: 'csv_upload_summary',
                status: 'skipped',
                requestPayload: [
                    'upload_id' => $this->uploadId,
                    'filename' => $this->filename,
                    'success_count' => $this->successCount,
                    'failed_count' => $this->failedCount,
                ],
                relatedType: CsvUpload::class,
                relatedId: $this->uploadId,
                meta: ['reason' => 'no_url'],
            );

            return;
        }

        $payload = [
            'upload_id' => $this->uploadId,
            'filename' => $this->filename,
            'success_count' => $this->successCount,
            'failed_count' => $this->failedCount,
            'sent_at' => now()->toISOString(),
            // GAS側で ±300秒バリデーションする前提（秒）
            'timestamp' => now()->timestamp,
        ];

        try {
            $secret = (string) config('services.gas.signing_secret', '');
            $body = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?: '';
            $ts = (string) now()->timestamp;
            $nonce = (string) Str::uuid();

            $signature = $secret === '' ? '' : hash_hmac('sha256', "{$ts}.{$nonce}.{$body}", $secret);

            $req = Http::timeout(3)
                ->acceptJson()
                ->asJson()
                ->withHeaders([
                    'X-LOM-Timestamp' => $ts,
                    'X-LOM-Nonce' => $nonce,
                ]);

            if ($signature !== '') {
                $req = $req->withHeaders([
                    'X-LOM-Signature' => $signature,
                    'X-LOM-Signature-Alg' => 'hmac-sha256',
                ]);
            }

            $res = $req->post($url, $payload);
            if (! $res->successful()) {
                Log::warning('SendCsvToGasJob failed', ['status' => $res->status()]);

                $this->auditLog(
                    integration: 'gas',
                    eventType: 'csv_upload_summary',
                    status: 'failed',
                    statusCode: $res->status(),
                    requestPayload: $payload,
                    responseBody: $res->body(),
                    relatedType: CsvUpload::class,
                    relatedId: $this->uploadId,
                );

                return;
            }

            $this->auditLog(
                integration: 'gas',
                eventType: 'csv_upload_summary',
                status: 'success',
                statusCode: $res->status(),
                requestPayload: $payload,
                responseBody: $res->body(),
                relatedType: CsvUpload::class,
                relatedId: $this->uploadId,
            );
        } catch (\Throwable $e) {
            Log::warning('SendCsvToGasJob exception', ['error' => $e->getMessage()]);

            $this->auditLog(
                integration: 'gas',
                eventType: 'csv_upload_summary',
                status: 'failed',
                requestPayload: $payload ?? null,
                errorMessage: $e->getMessage(),
                relatedType: CsvUpload::class,
                relatedId: $this->uploadId,
            );
        }
    }
}

