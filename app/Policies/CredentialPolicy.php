<?php

namespace App\Policies;

use App\Models\Credential;
use App\Models\User;

class CredentialPolicy
{
    private function isAdmin(User $actor): bool
    {
        return ($actor->role ?? 'general') === 'admin';
    }

    public function viewAny(User $actor): bool
    {
        return $this->isAdmin($actor);
    }

    public function view(User $actor, Credential $credential): bool
    {
        return $this->isAdmin($actor);
    }

    public function create(User $actor): bool
    {
        return $this->isAdmin($actor);
    }

    public function update(User $actor, Credential $credential): bool
    {
        return $this->isAdmin($actor);
    }

    public function delete(User $actor, Credential $credential): bool
    {
        return $this->isAdmin($actor);
    }
}

