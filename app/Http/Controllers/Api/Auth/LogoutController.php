<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Services\AuthService;
use App\Http\Resources\UserResource;

// ログアウトAPIコントローラ（指示書準拠）
class LogoutController extends Controller
{
    /**
     * ログアウト（トークン破棄）
     */
    public function logout(Request $request, AuthService $authService): JsonResponse
    {
        // 現在認証済みユーザー取得
        /** @var \App\Models\User $user */
        $user = $request->user();

        // サービス層に委譲（トークン削除＆ユーザー情報返却）
        $user = $authService->logout($user);

        // ユーザー情報レスポンス（metaキーは空配列で統一）
        return (new UserResource($user))
            ->additional(['meta' => []])
            ->response()
            ->setStatusCode(200);
    }
}
