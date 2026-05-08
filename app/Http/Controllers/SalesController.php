<?php

namespace App\Http\Controllers;

use App\Http\Resources\SalesSummaryResource;
use App\Services\SalesService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SalesController extends Controller
{
    public function summary(Request $request, SalesService $salesService): Response
    {
        $actor = $request->user();
        if ($actor === null) {
            abort(401);
        }

        $payload = $salesService->summary();
        $personalKpi = $salesService->personalSummary($actor);

        $resource = (new SalesSummaryResource($payload))
            ->additional(['meta' => []])
            ->response()
            ->getData(true);

        return Inertia::render('Sales/Summary', [
            'sales' => $resource,
            'personalKpi' => $personalKpi,
        ]);
    }
}
