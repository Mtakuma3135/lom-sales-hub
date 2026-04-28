<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Admin\CsvUploadRequest;
use App\Http\Resources\CsvUploadHistoryResource;
use App\Models\CsvUpload;
use App\Services\CsvImportService;
use Illuminate\Http\JsonResponse;

class CsvController extends Controller
{
    public function uploads(CsvImportService $csvImportService): JsonResponse
    {
        $this->authorize('viewAny', CsvUpload::class);

        $items = $csvImportService->uploads();

        return response()->json(CsvUploadHistoryResource::collection($items));
    }

    public function upload(CsvUploadRequest $request, CsvImportService $csvImportService): JsonResponse
    {
        $this->authorize('create', CsvUpload::class);

        $result = $csvImportService->upload($request->uploadFile(), $request->user());

        return response()->json([
            'upload_id' => (int) $result['upload_id'],
            'filename' => (string) $result['filename'],
            'success_count' => (int) $result['success_count'],
            'failed_count' => (int) $result['failed_count'],
            'errors' => $result['errors'],
        ]);
    }
}

