<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Public self-registration (/register)
    |--------------------------------------------------------------------------
    |
    | Disabled when APP_ENV is production unless REGISTRATION_ENABLED=true.
    | For internal hubs, keep this false and create users via admin.
    |
    */

    'registration_enabled' => filter_var(
        env('REGISTRATION_ENABLED', env('APP_ENV') !== 'production'),
        FILTER_VALIDATE_BOOLEAN
    ),

    /*
    |--------------------------------------------------------------------------
    | In-app KOT mock HTTP endpoint
    |--------------------------------------------------------------------------
    |
    | POST /portal/mock/kot/punch — disable in production unless you explicitly
    | need it (KOT_MOCK_ENDPOINT_ENABLED=true).
    |
    */

    'kot_mock_endpoint_enabled' => filter_var(
        env('KOT_MOCK_ENDPOINT_ENABLED', env('APP_ENV') !== 'production'),
        FILTER_VALIDATE_BOOLEAN
    ),

    /*
    |--------------------------------------------------------------------------
    | Force HTTPS URLs
    |--------------------------------------------------------------------------
    |
    | When true, generated URLs use https:// (set alongside TLS termination).
    |
    */

    'force_https' => filter_var(
        env('FORCE_HTTPS', env('APP_ENV') === 'production'),
        FILTER_VALIDATE_BOOLEAN
    ),

    /*
    |--------------------------------------------------------------------------
    | Admin session source IP allowlist
    |--------------------------------------------------------------------------
    |
    | When non-empty, users with role "admin" may only use the app from these
    | IPs (exact IPv4 or IPv4 CIDR, comma-separated). General users unaffected.
    | Example: 203.0.113.10,10.0.0.0/8
    |
    | @var list<string>
    */

    'admin_allowed_ips' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('ADMIN_ALLOWED_IPS', ''))
    ))),

    /*
    |--------------------------------------------------------------------------
    | Require administrators to enroll TOTP 2FA (Web session)
    |--------------------------------------------------------------------------
    |
    | When true, admin accounts must complete /two-factor/setup before using
    | the portal. API admins still complete TOTP via /api/auth/login/two-factor.
    |
    */

    'enforce_admin_two_factor' => filter_var(
        env('ENFORCE_ADMIN_2FA', false),
        FILTER_VALIDATE_BOOLEAN
    ),

    /*
    |--------------------------------------------------------------------------
    | Internal portal policy version
    |--------------------------------------------------------------------------
    |
    | Stored when an administrator confirms that the employee has received the
    | internal portal usage rules and personal information handling notice.
    |
    */

    'internal_policy_version' => env('INTERNAL_POLICY_VERSION', '2026-05-12'),

    /*
    |--------------------------------------------------------------------------
    | Extra Content-Security-Policy connect-src origins (browser → outbound)
    |--------------------------------------------------------------------------
    |
    | Comma-separated origins when the SPA must call APIs on other hosts
    | (e.g. https://api.example.com). Ignored entries are trimmed to empty.
    |
    | @var list<string>
    */

    'csp_connect_src_extra' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('CSP_CONNECT_SRC_EXTRA', ''))
    ))),

];
