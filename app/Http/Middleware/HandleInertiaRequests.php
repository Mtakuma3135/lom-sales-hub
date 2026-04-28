<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Middleware;
use App\Models\AuditLog;
use App\Models\CsvUpload;
use App\Models\Credential;
use App\Models\DiscordNotificationLog;
use App\Models\User;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        $can = [
            'admin_users' => $user ? Gate::allows('viewAny', User::class) : false,
            'admin_csv' => $user ? Gate::allows('viewAny', CsvUpload::class) : false,
            'admin_credentials' => $user ? Gate::allows('viewAny', Credential::class) : false,
            'admin_discord_notifications' => $user ? Gate::allows('viewAny', DiscordNotificationLog::class) : false,
            'admin_audit_logs' => $user ? Gate::allows('viewAny', AuditLog::class) : false,
        ];

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user,
                'can' => $can,
            ],
        ];
    }
}
