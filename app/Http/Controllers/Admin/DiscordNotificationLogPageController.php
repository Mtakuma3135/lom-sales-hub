<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\DiscordNotificationLog;
use Inertia\Inertia;
use Inertia\Response;

class DiscordNotificationLogPageController extends Controller
{
    public function index(): Response
    {
        $this->authorize('viewAny', DiscordNotificationLog::class);

        return Inertia::render('Admin/DiscordNotifications/Index');
    }
}

