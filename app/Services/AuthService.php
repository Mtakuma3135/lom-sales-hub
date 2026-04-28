<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthService
{
    /**
     * @return array{0: User, 1: string}
     */
    public function login(string $employeeCode, string $password): array
    {
        try {
            $user = User::query()
                ->where('employee_code', $employeeCode)
                ->first();

            if (! $user || ! Hash::check($password, $user->password)) {
                throw ValidationException::withMessages([
                    'employee_code' => [trans('auth.failed')],
                ]);
            }

            if (! $user->is_active) {
                throw ValidationException::withMessages([
                    'employee_code' => ['User is inactive.'],
                ]);
            }

            $token = $user->createToken('spa');
            $token->accessToken->forceFill(['last_used_at' => now()])->save();

            return [$user, $token->plainTextToken];
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Throwable $e) {
            Log::error('AuthService.login failed', [
                'employee_code' => $employeeCode,
                'error' => $e->getMessage(),
            ]);

            throw new \RuntimeException('Server error.', 500);
        }
    }

    public function logout(User $user): User
    {
        try {
            $accessToken = $user->currentAccessToken();

            if ($accessToken) {
                $accessToken->delete();
            } else {
                $user->tokens()->delete();
            }

            return $user;
        } catch (\Throwable $e) {
            Log::error('AuthService.logout failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            throw new \RuntimeException('Server error.', 500);
        }
    }

    public function me(User $user): User
    {
        return $user;
    }
}

