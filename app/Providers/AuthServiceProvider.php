<?php

namespace App\Providers;

use App\Models\Credential;
use App\Models\CsvUpload;
use App\Models\DiscordNotificationLog;
use App\Models\AuditLog;
use App\Models\LunchBreak;
use App\Models\Notice;
use App\Models\Product;
use App\Models\SalesRecord;
use App\Models\User;
use App\Policies\AuditLogPolicy;
use App\Policies\CredentialPolicy;
use App\Policies\CsvUploadPolicy;
use App\Policies\DiscordNotificationLogPolicy;
use App\Policies\LunchBreakPolicy;
use App\Policies\NoticePolicy;
use App\Policies\ProductPolicy;
use App\Policies\SalesRecordPolicy;
use App\Policies\UserPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array<class-string, class-string>
     */
    protected $policies = [
        User::class => UserPolicy::class,
        LunchBreak::class => LunchBreakPolicy::class,
        Product::class => ProductPolicy::class,
        Notice::class => NoticePolicy::class,
        CsvUpload::class => CsvUploadPolicy::class,
        Credential::class => CredentialPolicy::class,
        SalesRecord::class => SalesRecordPolicy::class,
        DiscordNotificationLog::class => DiscordNotificationLogPolicy::class,
        AuditLog::class => AuditLogPolicy::class,
    ];

    public function boot(): void
    {
        $this->registerPolicies();

        // Session-mock entities (no Eloquent model) still need centralized authorization.
        Gate::define('taskRequest.update', function (User $actor, array $task): bool {
            if (($actor->role ?? 'general') === 'admin') {
                return true;
            }

            $toUserId = isset($task['to_user_id']) ? (int) $task['to_user_id'] : null;
            return $toUserId !== null && $toUserId === (int) $actor->id;
        });
    }
}

