<?php

use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\CsvController as AdminCsvController;
use App\Http\Controllers\Admin\CredentialController as AdminCredentialController;
use App\Http\Controllers\Admin\NoticeController as AdminNoticeController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\AdminPageController;
use App\Http\Controllers\Admin\DiscordNotificationLogController as AdminDiscordNotificationLogController;
use App\Http\Controllers\Admin\DiscordNotificationLogPageController;
use App\Http\Controllers\Admin\AuditLogController as AdminAuditLogController;
use App\Http\Controllers\Admin\AuditLogPageController;
use App\Http\Controllers\Admin\DepartmentController as AdminDepartmentController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\LunchBreakController;
use App\Http\Controllers\MypageController;
use App\Http\Controllers\NoticeController;
use App\Http\Controllers\NoticeApiController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductApiController;
use App\Http\Controllers\ProductShowController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SalesController;
use App\Http\Controllers\SalesRecordController;
use App\Http\Controllers\TaskRequestController;
use App\Http\Controllers\KotMockController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::middleware('auth')->group(function () {
    // 旧URL互換（ブックマーク対応）
    Route::redirect('/home', '/portal');
    Route::redirect('/admin/users', '/portal/admin/users');
    Route::redirect('/lunch-breaks', '/portal/lunch-breaks');
    Route::redirect('/sales/summary', '/portal/sales');
    Route::redirect('/task-requests', '/portal/tasks');
    Route::redirect('/notices', '/portal/notices');
    Route::redirect('/products', '/portal/products');
    Route::redirect('/mypage', '/portal/mypage');
    Route::redirect('/admin/csv/upload', '/portal/csv');
    Route::redirect('/admin/credentials', '/portal/credentials');

    Route::prefix('portal')->group(function () {
        Route::get('/', [HomeController::class, 'index'])->name('home');

        // --- Portal routes ---
        Route::get('/lunch-breaks', [LunchBreakController::class, 'index'])->name('lunch-breaks.index');
        Route::post('/lunch-breaks', [LunchBreakController::class, 'store'])->name('lunch-breaks.store');
        Route::delete('/lunch-breaks/{id}', [LunchBreakController::class, 'destroy'])->name('lunch-breaks.destroy');
        Route::post('/lunch-breaks/assign', [LunchBreakController::class, 'assign'])->name('lunch-breaks.assign');
        Route::post('/lunch-breaks/complete', [LunchBreakController::class, 'complete'])->name('lunch-breaks.complete');

        Route::get('/sales', [SalesController::class, 'summary'])->name('sales.summary');
        Route::get('/sales/records', [SalesRecordController::class, 'page'])->name('sales.records');

        Route::get('/notices', [NoticeController::class, 'index'])->name('notices.index');
        Route::get('/products', [ProductController::class, 'index'])->name('products.index');
        Route::get('/products/{id}', [ProductShowController::class, 'show'])->name('products.show');
        Route::get('/tasks', [TaskRequestController::class, 'index'])->name('task-requests.index');
        Route::post('/tasks', [TaskRequestController::class, 'store'])->name('task-requests.store');
        Route::patch('/tasks/{id}', [TaskRequestController::class, 'update'])->name('task-requests.update');
        Route::get('/mypage', [MypageController::class, 'index'])->name('mypage.index');
        Route::patch('/mypage/password', [MypageController::class, 'updatePassword'])->name('mypage.password.update');

        // KOT mock endpoint (internal)
        Route::post('/mock/kot/punch', [KotMockController::class, 'punch'])->name('portal.mock.kot.punch');

        // 設計書URL: /portal/csv, /portal/credentials（管理者のみ）
        Route::get('/csv', [AdminPageController::class, 'csv'])->name('admin.csv.upload');
        Route::post('/csv', fn () => back())->name('admin.csv.upload.store');
        Route::get('/credentials', [AdminPageController::class, 'credentials'])->name('admin.credentials.index');
        Route::get('/discord-notifications', [DiscordNotificationLogPageController::class, 'index'])->name('admin.discord-notifications.index');
        Route::get('/audit-logs', [AuditLogPageController::class, 'index'])->name('admin.audit-logs.index');

        // Webセッション用 JSON API（UI接続の最短ルート）
        Route::get('/api/csv/uploads', [AdminCsvController::class, 'uploads'])->name('portal.api.csv.uploads');
        Route::post('/api/csv/upload', [AdminCsvController::class, 'upload'])->name('portal.api.csv.upload');

        Route::get('/api/credentials', [AdminCredentialController::class, 'index'])->name('portal.api.credentials.index');
        Route::patch('/api/credentials/{id}', [AdminCredentialController::class, 'update'])->name('portal.api.credentials.update');

        Route::get('/api/discord-notifications', [AdminDiscordNotificationLogController::class, 'index'])->name('portal.api.discord-notifications.index');
        Route::get('/api/discord-notifications/{id}', [AdminDiscordNotificationLogController::class, 'show'])->name('portal.api.discord-notifications.show');
        Route::post('/api/discord-notifications/{id}/retry', [AdminDiscordNotificationLogController::class, 'retry'])->name('portal.api.discord-notifications.retry');

        Route::get('/api/audit-logs', [AdminAuditLogController::class, 'index'])->name('portal.api.audit-logs.index');
        Route::get('/api/audit-logs/{id}', [AdminAuditLogController::class, 'show'])->name('portal.api.audit-logs.show');

        Route::get('/api/departments', [AdminDepartmentController::class, 'index'])->name('portal.api.departments.index');

        // Webセッション用 JSON API（一般ログインで使用）
        Route::get('/api/sales/records', [SalesRecordController::class, 'index'])->name('portal.api.sales.records');
        Route::get('/api/notices', [NoticeApiController::class, 'index'])->name('portal.api.notices.index');
        Route::get('/api/notices/{id}', [NoticeApiController::class, 'show'])->name('portal.api.notices.show');
        Route::get('/api/products', [ProductApiController::class, 'index'])->name('portal.api.products.index');
        Route::get('/api/products/{id}', [ProductApiController::class, 'show'])->name('portal.api.products.show');

        Route::post('/api/notices', [AdminNoticeController::class, 'store'])->name('portal.api.notices.store');
        Route::patch('/api/notices/{id}', [AdminNoticeController::class, 'update'])->name('portal.api.notices.update');

        Route::patch('/api/products/{id}', [AdminProductController::class, 'update'])->name('portal.api.products.update');

        Route::prefix('admin')->name('admin.')->group(function () {
            Route::get('/users', [AdminUserController::class, 'index'])->name('users.index');
            Route::post('/users', [AdminUserController::class, 'store'])->name('users.store');
            Route::patch('/users/{id}', [AdminUserController::class, 'update'])->name('users.update');
            Route::delete('/users/{id}', [AdminUserController::class, 'destroy'])->name('users.destroy');

            // 旧URL互換（/portal/admin/* → /portal/*）
            Route::redirect('/csv', '/portal/csv');
            Route::redirect('/credentials', '/portal/credentials');
        });
    });
});

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';