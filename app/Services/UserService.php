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
            ->with('department')
            ->orderByDesc('id')
            ->paginate($perPage);
    }

    /**
     * @param  array{name:string,employee_code:string,email?:string|null,password:string,role:string,is_active?:bool,internal_policy_explained?:bool|string|int}  $data
     */
    public function store(array $data): User
    {
        try {
            $policyExplained = filter_var($data['internal_policy_explained'] ?? false, FILTER_VALIDATE_BOOLEAN);

            return User::query()->create([
                'name' => $data['name'],
                'employee_code' => $data['employee_code'],
                'email' => $data['email'] ?? null,
                'password' => Hash::make($data['password']),
                'role' => $data['role'],
                'is_active' => $data['is_active'] ?? true,
                'internal_policy_explained_at' => $policyExplained ? now() : null,
                'internal_policy_version' => $policyExplained ? (string) config('lom.internal_policy_version') : null,
                'department_id' => null,
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
     * @param  array{name?:string,employee_code?:string,email?:string|null,password?:string|null,role?:string,is_active?:bool}  $data
     */
    public function update(int $id, array $data): User
    {
        try {
            $user = User::query()->findOrFail($id);

            if (array_key_exists('name', $data)) {
                $user->name = (string) $data['name'];
            }
            if (array_key_exists('employee_code', $data)) {
                $user->employee_code = (string) $data['employee_code'];
            }
            if (array_key_exists('email', $data)) {
                $user->email = $data['email'] !== null && $data['email'] !== '' ? (string) $data['email'] : null;
            }
            if (array_key_exists('password', $data) && is_string($data['password']) && $data['password'] !== '') {
                $user->password = Hash::make($data['password']);
            }
            if (array_key_exists('role', $data)) {
                $user->role = (string) $data['role'];
            }
            if (array_key_exists('is_active', $data)) {
                $user->is_active = (bool) $data['is_active'];
            }

            $user->save();

            return $user->refresh()->load('department');
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
