<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;

class ProductApiController extends Controller
{
    public function index(ProductService $productService): JsonResponse
    {
        $this->authorize('viewAny', Product::class);

        $actor = request()->user();
        if (! $actor) {
            abort(401);
        }

        $items = $productService->indexFor($actor);

        return response()->json(ProductResource::collection($items));
    }

    public function show(ProductService $productService, int $id): JsonResponse
    {
        $actor = request()->user();
        if (! $actor) {
            abort(401);
        }

        $row = $productService->findFor($actor, $id);
        $this->authorize('view', $row);

        return response()->json(new ProductResource($row));
    }
}

