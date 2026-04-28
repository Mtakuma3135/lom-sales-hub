<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class UserService
{
    public function index(int $perPage = 20): LengthAwarePaginator
    {
        return User::query()
            ->orderByDesc('id')
            ->paginate($perPage);
    }

    /**
     * @param  array{name:string,employee_code:string,email:string,password:string,role:string,is_active?:bool}  $data
     */
    public function store(array $data): User
    {
        try {
            return User::query()->create([
                'name' => $data['name'],
                'employee_code' => $data['employee_code'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'role' => $data['role'],
                'is_active' => $data['is_active'] ?? true,
            ]);
        } catch (\Throwable $e) {
            Log::error('UserService.store failed', [
                'employee_code' => $data['employee_code'] ?? null,
                'error' => $e->getMessage(),
            ]);

            throw new \RuntimeException('Server error.', 500);
        }
    }

    /**
     * @param  array{name?:string,role?:string,is_active?:bool}  $data
     */
    public function update(int $id, array $data): User
    {
        try {
            $user = User::query()->findOrFail($id);

            if (array_key_exists('name', $data)) {
                $user->name = (string) $data['name'];
            }
            if (array_key_exists('role', $data)) {
                $user->role = (string) $data['role'];
            }
            if (array_key_exists('is_active', $data)) {
                $user->is_active = (bool) $data['is_active'];
            }

            $user->save();

            return $user->refresh();
        } catch (\Throwable $e) {
            Log::error('UserService.update failed', [
                'id' => $id,
                'error' => $e->getMessage(),
            ]);

            throw new \RuntimeException('Server error.', 500);
        }
    }

    public function deactivate(int $id): User
    {
        return $this->update($id, ['is_active' => false]);
    }
}

