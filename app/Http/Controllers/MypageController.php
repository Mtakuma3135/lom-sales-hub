<?php

namespace App\Http\Controllers;

use App\Http\Resources\MypageResource;
use App\Http\Requests\MypagePasswordUpdateRequest;
use App\Services\MypageService;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class MypageController extends Controller
{
    public function index(Request $request, MypageService $mypageService): Response
    {
        $payload = $mypageService->index($request->user());

        $resource = (new MypageResource($payload))
            ->additional(['meta' => []])
            ->response()
            ->getData(true);

        return Inertia::render('Mypage/Index', [
            'mypage' => $resource,
        ]);
    }

    public function updatePassword(MypagePasswordUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        if (! $user) {
            abort(401);
        }

        $user->password = Hash::make($request->newPassword());
        $user->save();

        return Redirect::route('mypage.index');
    }
}

