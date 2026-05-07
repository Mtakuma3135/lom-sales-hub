<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

// ログイン/ログアウト コントローラ（指示書準拠）
class AuthenticatedSessionController extends Controller
{
    /**
     * ログイン画面表示
     */
    public function create(): Response
    {
        // passwordリセットルート有無, ステータスメッセージを渡す（指示書準拠）
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => session('status'),
        ]);
    }

    /**
     * ログイン処理
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        // バリデーション & 認証（LoginRequest利用、指示書どおり）
        $request->authenticate();

        // セッション再生成（セキュリティ対策、指示書準拠）
        $request->session()->regenerate();

        // ホーム（ホーム画面）へリダイレクト（'home'ルート名）
        return redirect()->intended(route('home'));
    }

    /**
     * ログアウト処理
     */
    public function destroy(Request $request): RedirectResponse
    {
        // ログアウト（webガード、指示通り）
        Auth::guard('web')->logout();

        // セッション無効化 & トークン再生成（指示書どおり）
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        // ログイン画面へリダイレクト
        return redirect()->route('login');
    }
}
