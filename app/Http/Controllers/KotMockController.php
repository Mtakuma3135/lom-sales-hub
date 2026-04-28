<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KotMockController extends Controller
{
    public function punch(Request $request): JsonResponse
    {
        // ダミー: ちょい遅延して外部通信っぽさを演出
        usleep(280 * 1000);

        return response()->json([
            'success' => true,
            'echo' => $request->all(),
            'server_time' => now()->toISOString(),
        ]);
    }
}

