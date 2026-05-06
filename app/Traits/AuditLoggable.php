<?php

namespace App\Traits;

/**
 * Backward-compatible alias for AuditLoggable.
 *
 * Existing code uses App\Concerns\AuditLoggable.
 * Some docs/specs refer to App\Traits\AuditLoggable.
 */
trait AuditLoggable
{
    use \App\Concerns\AuditLoggable;
}

