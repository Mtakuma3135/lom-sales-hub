<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Credential;
use App\Models\CsvUpload;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;

class AdminPageController extends Controller
{
    public function csv(): RedirectResponse
    {
        $this->authorize('viewAny', CsvUpload::class);

        return redirect()->route('sales.summary', ['tab' => 'csv']);
    }

    public function credentials(): Response
    {
        $this->authorize('viewAny', Credential::class);

        return Inertia::render('Admin/Credentials/Index');
    }
}
