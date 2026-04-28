<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    public function index(ProductService $productService): JsonResponse
    {
        $this->authorize('viewAny', Product::class);

        $items = $productService->index();

        return response()->json(ProductResource::collection($items));
    }

    public function show(ProductService $productService, int $id): JsonResponse
    {
        $product = new Product(['id' => $id]);
        $this->authorize('view', $product);

        $row = $productService->find($id);

        return response()->json(new ProductResource($row));
    }
}

