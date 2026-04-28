<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    private function isAdmin(User $actor): bool
    {
        return ($actor->role ?? 'general') === 'admin';
    }

    public function viewAny(User $actor): bool
    {
        return $this->isAdmin($actor);
    }

    public function view(User $actor, User $target): bool
    {
        return $this->isAdmin($actor) || (int) $actor->id === (int) $target->id;
    }

    public function create(User $actor): bool
    {
        return $this->isAdmin($actor);
    }

    public function update(User $actor, User $target): bool
    {
        return $this->isAdmin($actor);
    }

    public function delete(User $actor, User $target): bool
    {
        return $this->isAdmin($actor);
    }
}

