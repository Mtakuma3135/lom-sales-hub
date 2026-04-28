<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\ProductService;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(ProductService $productService): Response
    {
        $this->authorize('viewAny', Product::class);

        $products = $productService->index();

        $productsResource = ProductResource::collection($products)
            ->additional(['meta' => []])
            ->response()
            ->getData(true);

        return Inertia::render('Products/Index', [
            'products' => $productsResource,
        ]);
    }
}

