<?php

namespace App\Services;

use App\Concerns\AuditLoggable;
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
    ): string {
        $url = $this->resolveGasUrl($preferAuditLogUrl);
        if ($url === '') {
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

        if (! isset($payload['timestamp'])) {
            $payload['timestamp'] = now()->timestamp;
        }
        if (! isset($payload['sent_at'])) {
            $payload['sent_at'] = now()->toISOString();
        }

        try {
            $secret = (string) config('services.gas.signing_secret', '');
            $requestUrl = $this->urlWithQuerySignature($url, $secret);
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

            $res = $req->post($requestUrl, $payload);

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

    private function resolveGasUrl(bool $preferAuditLogUrl): string
    {
        if ($preferAuditLogUrl) {
            $audit = trim((string) config('services.gas.audit_log_url', ''));
            if ($audit !== '') {
                return $audit;
            }
        }

        return (string) config('services.gas.dummy_url', '');
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
