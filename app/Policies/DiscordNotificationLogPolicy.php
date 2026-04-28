<?php

namespace App\Policies;

use App\Models\DiscordNotificationLog;
use App\Models\User;

class DiscordNotificationLogPolicy
{
    private function isAdmin(User $actor): bool
    {
        return ($actor->role ?? 'general') === 'admin';
    }

    public function viewAny(User $actor): bool
    {
        return $this->isAdmin($actor);
    }

    public function view(User $actor, DiscordNotificationLog $log): bool
    {
        return $this->isAdmin($actor);
    }

    public function create(User $actor): bool
    {
        return $this->isAdmin($actor);
    }

    public function update(User $actor, DiscordNotificationLog $log): bool
    {
        return $this->isAdmin($actor);
    }

    public function delete(User $actor, DiscordNotificationLog $log): bool
    {
        return $this->isAdmin($actor);
    }
}

