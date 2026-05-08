<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductApiController extends Controller
{
    public function index(Request $request, ProductService $productService): JsonResponse
    {
        $this->authorize('viewAny', Product::class);

        $actor = $request->user();
        if (! $actor) {
            abort(401);
        }

        $q = $request->input('q');
        $category = $request->input('category');
        $activeRaw = $request->input('active_only', true);

        if (is_string($activeRaw)) {
            $activeOnly = in_array(strtolower($activeRaw), ['1', 'true', 'on', 'yes'], true);
        } else {
            $activeOnly = (bool) filter_var($activeRaw, FILTER_VALIDATE_BOOLEAN);
        }

        $items = $productService->indexFilteredFor(
            $actor,
            is_string($q) ? $q : null,
            is_string($category) ? $category : null,
            $activeOnly,
        );

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

