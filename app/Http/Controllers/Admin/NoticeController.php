<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\NoticeStoreRequest;
use App\Http\Requests\Admin\NoticeUpdateRequest;
use App\Http\Resources\NoticeResource;
use App\Models\Notice;
use App\Services\NoticeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class NoticeController extends Controller
{
    public function index(Request $request, NoticeService $noticeService): JsonResponse
    {
        $this->authorize('viewAny', Notice::class);

        $items = $noticeService->index();
        $q = trim((string) $request->input('q', ''));
        if ($q !== '') {
            $items = $items->filter(function (Notice $n) use ($q): bool {
                $title = (string) ($n->title ?? '');
                $body = (string) ($n->body ?? '');

                return mb_stripos($title.$body, $q) !== false;
            })->values();
        }

        return response()->json(NoticeResource::collection($items));
    }

    public function show(NoticeService $noticeService, int $id): JsonResponse
    {
        $notice = new Notice(['id' => $id]);
        $this->authorize('view', $notice);

        $row = $noticeService->find($id);

        return response()->json(new NoticeResource($row));
    }

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

    public function destroy(Request $request, NoticeService $noticeService, int $id): Response
    {
        $notice = $noticeService->find($id);
        $this->authorize('delete', $notice);
        $noticeService->destroy($id);

        return response()->noContent();
    }
}

