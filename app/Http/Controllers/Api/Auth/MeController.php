<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

// 認証済みユーザー取得APIコントローラ（指示書準拠）
class MeController extends Controller
{
    /**
     * 認証済みユーザー情報を返却
     */
    public function me(Request $request, AuthService $authService): JsonResponse
    {
        // 現在認証済みユーザー取得
        /** @var \App\Models\User $user */
        $user = $request->user();

        // サービス層に委譲（必要であれば情報更新後のユーザー取得）
        $user = $authService->me($user);

        // ユーザー情報＋meta／型付きレスポンス
        return (new UserResource($user))
            ->additional(['meta' => []])
            ->response()
            ->setStatusCode(200);
    }
}
