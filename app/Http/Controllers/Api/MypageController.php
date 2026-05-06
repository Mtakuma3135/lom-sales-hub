<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\MypagePasswordUpdateRequest;
use App\Services\MypageService;
use App\Services\KotApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class MypageController extends Controller
{
    public function index(MypageService $mypageService): JsonResponse
    {
        $user = request()->user();
        if (! $user) {
            abort(401);
        }

        $user->loadMissing('department');
        $attendance = $mypageService->attendance($user);

        return response()->json([
            'user' => [
                'id' => (int) $user->id,
                'name' => (string) $user->name,
                'employee_code' => (string) ($user->employee_code ?? ''),
                'department' => $user->department ? [
                    'id' => (int) $user->department->id,
                    'name' => (string) $user->department->name,
                    'code' => (string) $user->department->code,
                ] : null,
            ],
            'attendance' => $attendance,
        ]);
    }

    public function updatePassword(MypagePasswordUpdateRequest $request): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            abort(401);
        }

        $user->password = Hash::make($request->newPassword());
        $user->save();

        return response()->json([
            'message' => 'パスワードを変更しました。',
        ]);
    }

    public function kotPunch(KotApiService $kotApiService): JsonResponse
    {
        $user = request()->user();
        if (! $user) {
            abort(401);
        }

        return response()->json($kotApiService->punch($user));
    }
}
