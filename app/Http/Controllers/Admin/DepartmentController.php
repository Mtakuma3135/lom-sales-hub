<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Department;
use Illuminate\Http\JsonResponse;

class DepartmentController extends Controller
{
    public function index(): JsonResponse
    {
        // 部署一覧は管理UIの補助情報（admin-only）
        $this->authorize('viewAny', \App\Models\User::class);

        $items = Department::query()
            ->orderBy('id')
            ->get(['id', 'name', 'code']);

        return response()->json($items);
    }
}

