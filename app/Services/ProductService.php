<?php

namespace App\Services;

use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class ProductService
{
    /**
     * @return Collection<int, Product>
     */
    public function index(): Collection
    {
        try {
            return Product::query()
                ->orderByDesc('updated_at')
                ->get();
        } catch (\Throwable $e) {
            Log::error('ProductService.index failed', ['error' => $e->getMessage()]);
            return collect();
        }
    }

    /**
     * @return Collection<int, Product>
     */
    public function indexFor(User $actor): Collection
    {
        try {
            $q = Product::query()->orderByDesc('updated_at');
            if (($actor->role ?? 'general') !== 'admin') {
                $q->where('is_active', true);
            }

            return $q->get();
        } catch (\Throwable $e) {
            Log::error('ProductService.indexFor failed', ['error' => $e->getMessage()]);
            return collect();
        }
    }

    /**
     * @return Product
     */
    public function find(int $id): Product
    {
        return Product::query()->findOrFail($id);
    }

    public function findFor(User $actor, int $id): Product
    {
        $q = Product::query();
        if (($actor->role ?? 'general') !== 'admin') {
            $q->where('is_active', true);
        }

        return $q->findOrFail($id);
    }

    /**
     * @param  array{talk_script?:string,manual_url?:string}  $attrs
     * @return Product
     */
    public function update(int $id, array $attrs): Product
    {
        try {
            $product = Product::query()->findOrFail($id);
            if (array_key_exists('talk_script', $attrs)) {
                $product->talk_script = (string) ($attrs['talk_script'] ?? '');
            }
            if (array_key_exists('manual_url', $attrs)) {
                $product->manual_url = (string) ($attrs['manual_url'] ?? '');
            }
            $product->save();

            return $product->fresh();
        } catch (\Throwable $e) {
            Log::error('ProductService.update failed', ['id' => $id, 'error' => $e->getMessage()]);
            throw new \RuntimeException('Server error.', 500);
        }
    }
}

