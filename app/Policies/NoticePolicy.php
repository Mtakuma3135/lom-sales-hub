<?php

namespace App\Policies;

use App\Models\Notice;
use App\Models\User;

class NoticePolicy
{
    private function isAdmin(User $actor): bool
    {
        return ($actor->role ?? 'general') === 'admin';
    }

    public function viewAny(User $actor): bool
    {
        return $actor !== null;
    }

    public function view(User $actor, Notice $notice): bool
    {
        if ($this->isAdmin($actor)) {
            return true;
        }

        $publishedAt = $notice->published_at;
        if (! $publishedAt) {
            return false;
        }

        return $publishedAt->lte(now());
    }

    public function create(User $actor): bool
    {
        return $this->isAdmin($actor);
    }

    public function update(User $actor, Notice $notice): bool
    {
        return $this->isAdmin($actor);
    }

    public function delete(User $actor, Notice $notice): bool
    {
        return $this->isAdmin($actor);
    }
}

