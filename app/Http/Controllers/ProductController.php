<?php

namespace App\Http\Controllers;

use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\ProductService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request, ProductService $productService): Response
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

        $products = $productService->indexFilteredFor(
            $actor,
            is_string($q) ? $q : null,
            is_string($category) ? $category : null,
            $activeOnly,
        );

        $productsResource = ProductResource::collection($products)
            ->additional(['meta' => []])
            ->response()
            ->getData(true);

        return Inertia::render('Products/Index', [
            'products' => $productsResource,
            'filters' => [
                'q' => is_string($q) ? $q : '',
                'category' => is_string($category) ? $category : '',
                'active_only' => $activeOnly,
            ],
            'categoryOptions' => Product::query()
                ->select('category')
                ->distinct()
                ->orderBy('category')
                ->pluck('category')
                ->filter(fn ($c) => is_string($c) && $c !== '')
                ->values()
                ->all(),
        ]);
    }
}

