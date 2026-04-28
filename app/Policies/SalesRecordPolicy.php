<?php

namespace App\Policies;

use App\Models\SalesRecord;
use App\Models\User;

class SalesRecordPolicy
{
    private function isAdmin(User $actor): bool
    {
        return ($actor->role ?? 'general') === 'admin';
    }

    public function viewAny(User $actor): bool
    {
        // 現状の画面仕様: ログインユーザーは閲覧可能
        return $actor !== null;
    }

    public function view(User $actor, SalesRecord $salesRecord): bool
    {
        if ($this->isAdmin($actor)) {
            return true;
        }

        return $actor->department_id !== null
            && $salesRecord->department_id !== null
            && (int) $actor->department_id === (int) $salesRecord->department_id;
    }

    public function create(User $actor): bool
    {
        return $this->isAdmin($actor);
    }

    public function update(User $actor, SalesRecord $salesRecord): bool
    {
        return $this->isAdmin($actor);
    }

    public function delete(User $actor, SalesRecord $salesRecord): bool
    {
        return $this->isAdmin($actor);
    }
}

