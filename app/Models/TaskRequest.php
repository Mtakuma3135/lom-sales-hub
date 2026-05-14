<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\SoftDeletingScope;
use Illuminate\Support\Facades\Schema;

class TaskRequest extends Model
{
    use SoftDeletes {
        runSoftDelete as traitRunSoftDelete;
    }

    /** @var array<int, string> */
    protected $guarded = [];

    /** @var array<string, string> */
    protected $casts = [
        'due_date' => 'date',
    ];

    public static function softDeleteColumnExists(): bool
    {
        try {
            return Schema::hasColumn('task_requests', 'deleted_at');
        } catch (\Throwable) {
            return false;
        }
    }

    public static function bootSoftDeletes(): void
    {
        if (! static::softDeleteColumnExists()) {
            return;
        }

        static::addGlobalScope(new SoftDeletingScope);
    }

    protected function runSoftDelete(): mixed
    {
        if (! static::softDeleteColumnExists()) {
            abort(
                503,
                'task_requests.deleted_at がありません。`php artisan migrate` または `php artisan db:ensure-task-requests-soft-deletes` を実行してください。',
            );
        }

        return $this->traitRunSoftDelete();
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function toUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'to_user_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function fromUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'from_user_id');
    }
}
