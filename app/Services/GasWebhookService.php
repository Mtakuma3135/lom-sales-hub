<?php

namespace App\Services;

use App\Concerns\AuditLoggable;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class GasWebhookService
{
    use AuditLoggable;

    /**
     * GAS Web アプリ URL へ JSON POST。
     * GAS 側が e.parameter.signature を参照する場合、クエリ ?signature=... に共有秘密を付与する。
     * 併せて X-LOM-Signature（HMAC）ヘッダも従来どおり送る。
     *
     * @param  array<string, mixed>  $payload
     * @return 'skipped'|'success'|'failed'
     */
    public function post(
        array $payload,
        string $auditEventType,
        ?string $relatedType = null,
        ?int $relatedId = null,
        bool $preferAuditLogUrl = false,
        ?string $customBaseUrl = null,
    ): string {
        $base = $this->resolvePostBaseUrl($preferAuditLogUrl, $customBaseUrl);
        if ($base === '') {
            $this->auditLog(
                integration: 'gas',
                eventType: $auditEventType,
                status: 'skipped',
                requestPayload: $payload,
                relatedType: $relatedType,
                relatedId: $relatedId,
                meta: ['reason' => 'no_url'],
            );

            return 'skipped';
        }

        try {
            $res = $this->sendSignedPost($base, $payload);

            if (! $res->successful()) {
                Log::warning('GasWebhookService.post failed', ['status' => $res->status(), 'event' => $auditEventType]);

                $this->auditLog(
                    integration: 'gas',
                    eventType: $auditEventType,
                    status: 'failed',
                    statusCode: $res->status(),
                    requestPayload: $payload,
                    responseBody: mb_substr((string) $res->body(), 0, 20000),
                    relatedType: $relatedType,
                    relatedId: $relatedId,
                );

                return 'failed';
            }

            $this->auditLog(
                integration: 'gas',
                eventType: $auditEventType,
                status: 'success',
                statusCode: $res->status(),
                requestPayload: $payload,
                responseBody: mb_substr((string) $res->body(), 0, 20000),
                relatedType: $relatedType,
                relatedId: $relatedId,
            );

            return 'success';
        } catch (\Throwable $e) {
            Log::warning('GasWebhookService.post exception', ['error' => $e->getMessage(), 'event' => $auditEventType]);

            $this->auditLog(
                integration: 'gas',
                eventType: $auditEventType,
                status: 'failed',
                requestPayload: $payload,
                errorMessage: $e->getMessage(),
                relatedType: $relatedType,
                relatedId: $relatedId,
            );

            return 'failed';
        }
    }

    /**
     * 資格情報一覧を GAS から取得する（POST { event: credentials_pull }）。レスポンス JSON を返す。
     *
     * @return array<string, mixed>|null
     */
    public function pullCredentialsJson(): ?array
    {
        $base = $this->resolveCredentialsBaseUrl();
        if ($base === '') {
            return null;
        }

        $payload = [
            'event' => 'credentials_pull',
            'timestamp' => now()->timestamp,
            'sent_at' => now()->toISOString(),
        ];

        try {
            $res = $this->sendSignedPost($base, $payload);
            if (! $res->successful()) {
                Log::warning('GasWebhookService.pullCredentialsJson failed', ['status' => $res->status()]);

                return null;
            }

            /** @var array<string, mixed>|null $json */
            $json = $res->json();

            return is_array($json) ? $json : null;
        } catch (\Throwable $e) {
            Log::warning('GasWebhookService.pullCredentialsJson exception', ['error' => $e->getMessage()]);

            return null;
        }
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function sendSignedPost(string $baseUrl, array $payload): Response
    {
        if (! isset($payload['timestamp'])) {
            $payload['timestamp'] = now()->timestamp;
        }
        if (! isset($payload['sent_at'])) {
            $payload['sent_at'] = now()->toISOString();
        }

        $secret = (string) config('services.gas.signing_secret', '');
        $requestUrl = $this->urlWithQuerySignature($baseUrl, $secret);
        $body = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) ?: '';
        $ts = (string) $payload['timestamp'];
        $nonce = (string) Str::uuid();
        $hmacSignature = $secret === '' ? '' : hash_hmac('sha256', "{$ts}.{$nonce}.{$body}", $secret);

        $req = Http::timeout(10)
            ->acceptJson()
            ->asJson()
            ->withHeaders([
                'X-LOM-Timestamp' => $ts,
                'X-LOM-Nonce' => $nonce,
            ]);

        if ($hmacSignature !== '') {
            $req = $req->withHeaders([
                'X-LOM-Signature' => $hmacSignature,
                'X-LOM-Signature-Alg' => 'hmac-sha256',
            ]);
        }

        return $req->post($requestUrl, $payload);
    }

    private function resolvePostBaseUrl(bool $preferAuditLogUrl, ?string $customBaseUrl): string
    {
        if ($customBaseUrl !== null && trim($customBaseUrl) !== '') {
            return trim($customBaseUrl);
        }

        return $this->resolveGasUrl($preferAuditLogUrl);
    }

    private function resolveCredentialsBaseUrl(): string
    {
        $c = trim((string) config('services.gas.credentials_url', ''));
        if ($c !== '') {
            return $c;
        }

        return trim((string) config('services.gas.dummy_url', ''));
    }

    private function resolveGasUrl(bool $preferAuditLogUrl): string
    {
        if ($preferAuditLogUrl) {
            $audit = trim((string) config('services.gas.audit_log_url', ''));
            if ($audit !== '') {
                return $audit;
            }
        }

        return trim((string) config('services.gas.dummy_url', ''));
    }

    /**
     * GAS doPost では e.parameter.signature でクエリのみ参照されることがあるため、共有秘密を付与する。
     */
    private function urlWithQuerySignature(string $url, string $secret): string
    {
        if ($secret === '') {
            return $url;
        }

        $sep = str_contains($url, '?') ? '&' : '?';

        return $url.$sep.'signature='.rawurlencode($secret);
    }
}
