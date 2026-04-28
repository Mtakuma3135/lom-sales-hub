<?php

namespace App\Http\Controllers;

use App\Http\Resources\SalesSummaryResource;
use App\Services\SalesService;
use Inertia\Inertia;
use Inertia\Response;

class SalesController extends Controller
{
    public function summary(SalesService $salesService): Response
    {
        $payload = $salesService->summary();

        $resource = (new SalesSummaryResource($payload))
            ->additional(['meta' => []])
            ->response()
            ->getData(true);

        return Inertia::render('Sales/Summary', [
            'sales' => $resource,
        ]);
    }
}

