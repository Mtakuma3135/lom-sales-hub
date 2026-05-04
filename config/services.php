<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'discord' => [
        'webhook_url' => env('DISCORD_WEBHOOK_URL', env('GOOGLE_CHAT_WEBHOOK_URL', '')),
    ],

    'kot' => [
        // 未設定時はアプリ内のダミーエンドポイントを使用
        'mock_url' => env('KOT_MOCK_URL', ''),
        'api_url' => env('KOT_API_URL', ''),
        'api_token' => env('KOT_API_TOKEN', ''),
    ],

    'gas' => [
        // CSVアップロード後にダミー転送（Queue）するURL
        'dummy_url' => env('GAS_DUMMY_URL', ''),
        // 監査ログ・手動テストなど（未設定時は dummy_url と同じ）
        'audit_log_url' => env('GAS_AUDIT_LOG_URL', ''),
        // ID/パス一覧の取得・更新（未設定時は dummy_url で pull / push を試行）
        'credentials_url' => env('GAS_CREDENTIALS_URL', ''),
        'signing_secret' => env('GAS_SIGNING_SECRET', ''),
    ],

];
