<?php

namespace App\Policies;

use App\Models\Product;
use App\Models\User;

class ProductPolicy
{
    private function isAdmin(User $actor): bool
    {
        return ($actor->role ?? 'general') === 'admin';
    }

    public function viewAny(User $actor): bool
    {
        return $actor !== null;
    }

    public function view(User $actor, Product $product): bool
    {
        if ($this->isAdmin($actor)) {
            return true;
        }

        return (bool) ($product->is_active ?? false);
    }

    public function create(User $actor): bool
    {
        return $this->isAdmin($actor);
    }

    public function update(User $actor, Product $product): bool
    {
        return $this->isAdmin($actor);
    }

    public function delete(User $actor, Product $product): bool
    {
        return $this->isAdmin($actor);
    }
}

