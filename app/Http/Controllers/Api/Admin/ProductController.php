<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Admin\ProductUpdateRequest;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\ProductService;
use Illuminate\Http\JsonResponse;

class ProductController extends Controller
{
    public function update(ProductUpdateRequest $request, ProductService $productService, int $id): JsonResponse
    {
        $product = new Product(['id' => $id]);
        $this->authorize('update', $product);

        $row = $productService->update($id, $request->attrs());

        return response()->json(new ProductResource($row));
    }
}

