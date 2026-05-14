<?php

namespace App\Http\Controllers;

use App\Http\Resources\NoticeResource;
use App\Models\Notice;
use App\Services\NoticeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NoticeApiController extends Controller
{
    public function index(Request $request, NoticeService $noticeService): JsonResponse
    {
        $this->authorize('viewAny', Notice::class);

        $actor = $request->user();
        if (! $actor) {
            abort(401);
        }

        $draftsOnly = (string) $request->input('drafts', '') === '1';
        $items = $draftsOnly ? $noticeService->draftsFor($actor) : $noticeService->indexFor($actor);
        $items = $noticeService->attachReadFlags($actor, $items);
        $q = trim((string) $request->input('q', ''));
        if ($q !== '') {
            $items = $items->filter(function (Notice $n) use ($q) {
                $title = (string) ($n->title ?? '');
                $body = (string) ($n->body ?? '');

                return mb_stripos($title.$body, $q) !== false;
            })->values();
        }

        return response()->json(NoticeResource::collection($items));
    }

    public function show(Request $request, NoticeService $noticeService, int $id): JsonResponse
    {
        $actor = $request->user();
        if (! $actor) {
            abort(401);
        }

        $row = $noticeService->findFor($actor, $id);
        $this->authorize('view', $row);

        return response()->json(new NoticeResource($row));
    }

    public function markRead(Request $request, NoticeService $noticeService, int $id): JsonResponse
    {
        $actor = $request->user();
        if (! $actor) {
            abort(401);
        }

        $row = $noticeService->findFor($actor, $id);
        $this->authorize('view', $row);
        $noticeService->markRead($actor, $id);

        return response()->json(['ok' => true]);
    }

    public function markUnread(Request $request, NoticeService $noticeService, int $id): JsonResponse
    {
        $actor = $request->user();
        if (! $actor) {
            abort(401);
        }

        $row = $noticeService->findFor($actor, $id);
        $this->authorize('view', $row);
        $noticeService->markUnread($actor, $id);

        return response()->json(['ok' => true]);
    }
}
