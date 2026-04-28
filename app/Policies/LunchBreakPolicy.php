<?php

namespace App\Policies;

use App\Models\LunchBreak;
use App\Models\User;

class LunchBreakPolicy
{
    private function isAdmin(User $actor): bool
    {
        return ($actor->role ?? 'general') === 'admin';
    }

    public function viewAny(User $actor): bool
    {
        return $actor !== null;
    }

    public function create(User $actor): bool
    {
        // 現仕様: 管理者割当制
        return $this->isAdmin($actor);
    }

    public function assign(User $actor): bool
    {
        return $this->isAdmin($actor);
    }

    public function delete(User $actor, LunchBreak $lunchBreak): bool
    {
        return $this->isAdmin($actor) || (int) $lunchBreak->user_id === (int) $actor->id;
    }
}

