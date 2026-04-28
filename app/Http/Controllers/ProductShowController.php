<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class ProductShowController extends Controller
{
    public function show(int $id): Response
    {
        return Inertia::render('Products/Show', [
            'id' => $id,
        ]);
    }
}

