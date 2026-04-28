<?php

use App\Http\Controllers\Api\Auth\LoginController;
use App\Http\Controllers\Api\Auth\LogoutController;
use App\Http\Controllers\Api\Auth\MeController;
use App\Http\Controllers\Api\Admin\CredentialController as AdminCredentialController;
use App\Http\Controllers\Api\Admin\CsvController as AdminCsvController;
use App\Http\Controllers\Api\Admin\UserController as AdminUserController;
use App\Http\Controllers\Api\Admin\NoticeController as AdminNoticeController;
use App\Http\Controllers\Api\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Api\NoticeController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\SalesRecordController;
use App\Http\Controllers\Api\TaskRequestController;
use App\Http\Controllers\Api\MypageController;
use App\Http\Middleware\UpdateLastUsedAt;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function () {
    Route::post('/login', [LoginController::class, 'login']);

    Route::middleware(['auth:sanctum', UpdateLastUsedAt::class])->group(function () {
        Route::post('/logout', [LogoutController::class, 'logout']);
        Route::get('/me', [MeController::class, 'me']);
    });
});

Route::middleware(['auth:sanctum', UpdateLastUsedAt::class])->group(function () {
    Route::get('/sales/records', [SalesRecordController::class, 'index']);
    Route::get('/notices', [NoticeController::class, 'index']);
    Route::get('/notices/{id}', [NoticeController::class, 'show']);
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{id}', [ProductController::class, 'show']);
    Route::get('/task-requests', [TaskRequestController::class, 'index']);
    Route::post('/task-requests', [TaskRequestController::class, 'store']);
    Route::patch('/task-requests/{id}', [TaskRequestController::class, 'update']);
    Route::get('/mypage', [MypageController::class, 'index']);
    Route::patch('/mypage/password', [MypageController::class, 'updatePassword']);
    Route::post('/mypage/kot/punch', [MypageController::class, 'kotPunch']);
});

Route::middleware(['auth:sanctum', UpdateLastUsedAt::class])->group(function () {
    Route::get('/users', [AdminUserController::class, 'index']);
    Route::post('/users', [AdminUserController::class, 'store']);
    Route::patch('/users/{id}', [AdminUserController::class, 'update']);
    Route::delete('/users/{id}', [AdminUserController::class, 'destroy']);

    Route::get('/credentials', [AdminCredentialController::class, 'index']);
    Route::patch('/credentials/{id}', [AdminCredentialController::class, 'update']);

    Route::post('/csv/upload', [AdminCsvController::class, 'upload']);
    Route::get('/csv/uploads', [AdminCsvController::class, 'uploads']);

    Route::post('/notices', [AdminNoticeController::class, 'store']);
    Route::patch('/notices/{id}', [AdminNoticeController::class, 'update']);

    Route::patch('/products/{id}', [AdminProductController::class, 'update']);
});

