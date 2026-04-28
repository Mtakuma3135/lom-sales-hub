<?php

namespace App\Http\Controllers;

use App\Http\Resources\NoticeResource;
use App\Models\Notice;
use App\Services\NoticeService;
use Inertia\Inertia;
use Inertia\Response;

class NoticeController extends Controller
{
    public function index(NoticeService $noticeService): Response
    {
        $this->authorize('viewAny', Notice::class);

        $notices = $noticeService->index();

        $noticesResource = NoticeResource::collection($notices)
            ->additional(['meta' => []])
            ->response()
            ->getData(true);

        return Inertia::render('Notices/Index', [
            'notices' => $noticesResource,
        ]);
    }
}