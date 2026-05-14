<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;
use Inertia\Response;
use PragmaRX\Google2FA\Google2FA;

/**
 * enforce_admin_two_factor 用の最小 TOTP セットアップ（Breeze 2FA 未導入時の代替）。
 */
class AdminTwoFactorController extends Controller
{
    private const SESSION_KEY = 'lom_admin_two_factor_secret_pending';

    public function show(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        if (! $user instanceof User || ($user->role ?? 'general') !== 'admin') {
            abort(403);
        }
        if ($user->hasTwoFactorEnabled()) {
            return redirect()->route('home');
        }

        $g2fa = new Google2FA;
        $secret = Session::get(self::SESSION_KEY);
        if (! is_string($secret) || strlen($secret) < 16) {
            $secret = $g2fa->generateSecretKey();
            Session::put(self::SESSION_KEY, $secret);
        }

        $issuer = (string) config('app.name', 'LOM Hub');
        $label = (string) ($user->email ?? $user->employee_code ?? 'admin');
        $otpauthUrl = $g2fa->getQRCodeUrl($issuer, $label, $secret);

        return Inertia::render('Admin/TwoFactorSetup', [
            'secret' => $secret,
            'otpauthUrl' => $otpauthUrl,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $user = $request->user();
        if (! $user instanceof User || ($user->role ?? 'general') !== 'admin') {
            abort(403);
        }
        if ($user->hasTwoFactorEnabled()) {
            return redirect()->route('home');
        }

        $request->validate([
            'code' => ['required', 'string', 'size:6', 'regex:/^[0-9]+$/'],
        ]);

        $secret = Session::pull(self::SESSION_KEY);
        if (! is_string($secret)) {
            return redirect()->route('portal.two-factor.setup')
                ->with('error', 'セットアップを最初からやり直してください。');
        }

        $g2fa = new Google2FA;
        if (! $g2fa->verifyKey($secret, (string) $request->input('code'), 4)) {
            Session::put(self::SESSION_KEY, $secret);

            return redirect()->back()->withErrors(['code' => '認証コードが正しくありません。']);
        }

        $user->forceFill([
            'two_factor_secret' => $secret,
            'two_factor_confirmed_at' => now(),
        ])->save();

        return redirect()->route('home')->with('status', '二要素認証を有効にしました。');
    }
}
