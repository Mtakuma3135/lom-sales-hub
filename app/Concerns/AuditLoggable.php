<?php

namespace App\Concerns;

use App\Models\AuditLog;
use App\Models\User;

trait AuditLoggable
{
    /**
     * @param  array<string, mixed>|null  $requestPayload
     * @param  array<string, mixed>  $meta
     */
    protected function auditLog(
        string $integration,
        string $eventType,
        string $status,
        ?int $statusCode = null,
        ?array $requestPayload = null,
        ?string $responseBody = null,
        ?string $errorMessage = null,
        ?User $actor = null,
        ?string $relatedType = null,
        ?int $relatedId = null,
        array $meta = [],
    ): void {
        try {
            $mode = null;
            if (isset($meta['mode']) && is_string($meta['mode']) && $meta['mode'] !== '') {
                $mode = mb_substr($meta['mode'], 0, 30);
            }

            AuditLog::query()->create([
                'integration' => $integration,
                'event_type' => $eventType,
                'status' => $status,
                'status_code' => $statusCode,
                'request_payload' => $requestPayload,
                'response_body' => $responseBody,
                'error_message' => $errorMessage,
                'actor_id' => $actor?->id,
                'related_type' => $relatedType,
                'related_id' => $relatedId,
                'meta' => $meta,
                'mode' => $mode,
            ]);
        } catch (\Throwable) {
            // audit logging must never block core flow
        }
    }
}

