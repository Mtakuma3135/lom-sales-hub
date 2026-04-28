<?php

namespace App\Policies;

use App\Models\CsvUpload;
use App\Models\User;

class CsvUploadPolicy
{
    private function isAdmin(User $actor): bool
    {
        return ($actor->role ?? 'general') === 'admin';
    }

    public function viewAny(User $actor): bool
    {
        return $this->isAdmin($actor);
    }

    public function view(User $actor, CsvUpload $csvUpload): bool
    {
        return $this->isAdmin($actor);
    }

    public function create(User $actor): bool
    {
        return $this->isAdmin($actor);
    }

    public function update(User $actor, CsvUpload $csvUpload): bool
    {
        return $this->isAdmin($actor);
    }

    public function delete(User $actor, CsvUpload $csvUpload): bool
    {
        return $this->isAdmin($actor);
    }
}

