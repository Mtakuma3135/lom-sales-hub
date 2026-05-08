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
     * @return Collection<int, Product>
     */
    public function indexFilteredFor(User $actor, ?string $search, ?string $category, bool $activeOnly): Collection
    {
        try {
            $q = Product::query()->orderByDesc('updated_at');
            $isAdmin = ($actor->role ?? 'general') === 'admin';

            if (! $isAdmin) {
                $q->where('is_active', true);
            } elseif ($activeOnly) {
                $q->where('is_active', true);
            }

            $t = $search !== null ? trim($search) : '';
            if ($t !== '') {
                $safe = str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $t);
                $like = '%'.$safe.'%';
                $q->where(function ($qq) use ($like): void {
                    $qq->where('name', 'like', $like)
                        ->orWhere('category', 'like', $like);
                });
            }

            $c = $category !== null ? trim($category) : '';
            if ($c !== '' && $c !== 'すべて' && $c !== '__all__') {
                $q->where('category', $c);
            }

            return $q->get();
        } catch (\Throwable $e) {
            Log::error('ProductService.indexFilteredFor failed', ['error' => $e->getMessage()]);

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
     * @param  array{talk_script?:string,manual_url?:string,name?:string,category?:string,price?:int,is_active?:bool}  $attrs
     * @return Product
     */
    public function update(int $id, array $attrs): Product
    {
        try {
            $product = Product::query()->findOrFail($id);
            if (array_key_exists('name', $attrs)) {
                $product->name = (string) ($attrs['name'] ?? '');
            }
            if (array_key_exists('category', $attrs)) {
                $product->category = (string) ($attrs['category'] ?? '');
            }
            if (array_key_exists('price', $attrs)) {
                $product->price = (int) ($attrs['price'] ?? 0);
            }
            if (array_key_exists('is_active', $attrs)) {
                $product->is_active = (bool) ($attrs['is_active'] ?? false);
            }
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

