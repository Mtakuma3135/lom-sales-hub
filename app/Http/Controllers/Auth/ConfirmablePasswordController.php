<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

// パスワード再確認コントローラ（指示書準拠）
class ConfirmablePasswordController extends Controller
{
    /**
     * パスワード確認画面表示
     */
    public function show(): Response
    {
        // inertia画面表示（コンポーネント名指定のみ）
        return Inertia::render('Auth/ConfirmPassword');
    }

    /**
     * パスワード確認処理
     */
    public function store(Request $request): RedirectResponse
    {
        // 社員コード + パスワードで再認証
        $credentials = [
            'employee_code' => $request->user()->employee_code,
            'password' => $request->password,
        ];

        if (!Auth::guard('web')->validate($credentials)) {
            // バリデーションエラー（言語ファイル'default'準拠）
            throw ValidationException::withMessages([
                'password' => __('auth.password'),
            ]);
        }

        // パスワード確認成功時、タイムスタンプをセッション格納（公式+指示書の通り）
        $request->session()->put('auth.password_confirmed_at', time());

        // intended: 直前のリダイレクト先 or ホームへ（指示書準拠, Laravel公式対応）
        return redirect()->intended(route('home'));
    }
}
