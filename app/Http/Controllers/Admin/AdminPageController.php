<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Credential;
use App\Models\CsvUpload;
use Inertia\Inertia;
use Inertia\Response;

class AdminPageController extends Controller
{
    public function csv(): Response
    {
        $this->authorize('viewAny', CsvUpload::class);

        return Inertia::render('Admin/Csv/Upload');
    }

    public function credentials(): Response
    {
        $this->authorize('viewAny', Credential::class);

        return Inertia::render('Admin/Credentials/Index');
    }
}

