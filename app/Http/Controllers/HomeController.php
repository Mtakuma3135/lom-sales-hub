<?php

namespace App\Http\Controllers;

use App\Http\Resources\LunchBreakSlotResource;
use App\Http\Resources\NoticeResource;
use App\Http\Resources\SalesSummaryResource;
use App\Services\HomeService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class HomeController extends Controller
{
    public function index(Request $request, HomeService $homeService): Response
    {
        $actor = $request->user();
        if ($actor === null) {
            abort(401);
        }

        $payload = $homeService->dashboard($actor);

        $noticesResource = NoticeResource::collection($payload['notices'])
            ->additional(['meta' => []])
            ->response()
            ->getData(true);

        $lunchResource = LunchBreakSlotResource::collection($payload['lunchBreaks'])
            ->additional(['meta' => ['date' => $payload['lunchDate']]])
            ->response()
            ->getData(true);

        $kpiResource = (new SalesSummaryResource($payload['kpi']))
            ->additional(['meta' => []])
            ->response()
            ->getData(true);

        return Inertia::render('Home/Index', [
            'notices' => $noticesResource,
            'lunchBreaks' => $lunchResource,
            'kpi' => $kpiResource,
        ]);
    }
}

