<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;

// ログインAPIコントローラ（指示書準拠）
class LoginController extends Controller
{
    /**
     * ログイン認証&トークン発行
     */
    public function login(LoginRequest $request, AuthService $authService): JsonResponse
    {
        // サービス層に委譲（社員番号・パスワードで認証→ユーザー&トークン発行）
        [$user, $plainTextToken] = $authService->login(
            $request->employeeCode(),
            $request->password()
        );

        // ユーザー情報＋トークン／型付きレスポンス
        return (new UserResource($user))
            ->additional([
                'meta' => [
                    'token' => $plainTextToken,
                    'token_type' => 'Bearer',
                ],
            ])
            ->response()
            ->setStatusCode(200);
    }
}
