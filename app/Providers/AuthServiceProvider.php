<?php

namespace App\Providers;

use App\Models\AuditLog;
use App\Models\Credential;
use App\Models\CsvUpload;
use App\Models\DiscordNotificationLog;
use App\Models\LunchBreak;
use App\Models\Notice;
use App\Models\Product;
use App\Models\SalesRecord;
use App\Models\TaskRequest;
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

        Gate::define('taskRequest.updateStatus', function (User $actor, TaskRequest $task): bool {
            if (($actor->role ?? 'general') === 'admin') {
                return true;
            }

            return (int) $task->to_user_id === (int) $actor->id;
        });

        Gate::define('taskRequest.updateFields', function (User $actor, TaskRequest $task): bool {
            if (($actor->role ?? 'general') === 'admin') {
                return true;
            }

            return (int) $task->to_user_id === (int) $actor->id;
        });

        Gate::define('taskRequest.delete', function (User $actor, TaskRequest $task): bool {
            if (($actor->role ?? 'general') === 'admin') {
                return true;
            }

            $id = (int) $actor->id;

            return (int) $task->to_user_id === $id || (int) $task->from_user_id === $id;
        });

        Gate::define('taskRequest.restore', function (User $actor, TaskRequest $task): bool {
            if (($actor->role ?? 'general') === 'admin') {
                return true;
            }
            $id = (int) $actor->id;

            return (int) $task->to_user_id === $id || (int) $task->from_user_id === $id;
        });
    }
}
