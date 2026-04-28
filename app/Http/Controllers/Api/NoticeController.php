<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\NoticeIndexRequest;
use App\Http\Resources\NoticeResource;
use App\Models\Notice;
use App\Services\NoticeService;
use Illuminate\Http\JsonResponse;

class NoticeController extends Controller
{
    public function index(NoticeIndexRequest $request, NoticeService $noticeService): JsonResponse
    {
        $this->authorize('viewAny', Notice::class);

        $items = $noticeService->index();

        $q = $request->query();
        if ($q !== '') {
            $items = $items->filter(function (array $n) use ($q) {
                $title = (string) ($n['title'] ?? '');
                $body = (string) ($n['body'] ?? '');
                return mb_stripos($title.$body, $q) !== false;
            })->values();
        }

        return response()->json(NoticeResource::collection($items));
    }

    public function show(NoticeService $noticeService, int $id): JsonResponse
    {
        $notice = new Notice(['id' => $id]);
        $this->authorize('view', $notice);

        $item = $noticeService->find($id);

        return response()->json(new NoticeResource($item));
    }
}

