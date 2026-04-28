<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogPageController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', AuditLog::class);

        return Inertia::render('Admin/AuditLogs/Index');
    }
}

