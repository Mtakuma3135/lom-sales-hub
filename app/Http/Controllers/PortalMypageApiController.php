<?php

namespace App\Http\Controllers;

use App\Services\KotApiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PortalMypageApiController extends Controller
{
    public function kotPunch(Request $request, KotApiService $kotApiService): JsonResponse
    {
        $user = $request->user();
        if (! $user) {
            abort(401);
        }

        return response()->json($kotApiService->punch($user));
    }
}

