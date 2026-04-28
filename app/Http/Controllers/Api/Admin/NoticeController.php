<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Admin\NoticeStoreRequest;
use App\Http\Requests\Api\Admin\NoticeUpdateRequest;
use App\Http\Resources\NoticeResource;
use App\Models\Notice;
use App\Services\NoticeService;
use Illuminate\Http\JsonResponse;

class NoticeController extends Controller
{
    public function store(NoticeStoreRequest $request, NoticeService $noticeService): JsonResponse
    {
        $this->authorize('create', Notice::class);

        $row = $noticeService->store(
            $request->title(),
            $request->body(),
            $request->isPinned(),
            $request->publishedAt(),
        );

        return response()->json(new NoticeResource($row), 201);
    }

    public function update(NoticeUpdateRequest $request, NoticeService $noticeService, int $id): JsonResponse
    {
        $notice = new Notice(['id' => $id]);
        $this->authorize('update', $notice);

        $row = $noticeService->update($id, $request->attrs());

        return response()->json(new NoticeResource($row));
    }
}

