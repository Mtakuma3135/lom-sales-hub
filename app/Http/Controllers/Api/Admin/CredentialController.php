<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Admin\CredentialUpdateRequest;
use App\Http\Resources\CredentialResource;
use App\Models\Credential;
use App\Services\CredentialService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CredentialController extends Controller
{
    public function index(CredentialService $credentialService): JsonResponse
    {
        $this->authorize('viewAny', Credential::class);

        $items = $credentialService->index();

        return response()->json(CredentialResource::collection($items));
    }

    public function update(CredentialUpdateRequest $request, CredentialService $credentialService, int $id): JsonResponse
    {
        $credential = new Credential(['id' => $id]);
        $this->authorize('update', $credential);

        $updated = $credentialService->update($id, $request->value(), $request->updatedAt());

        return response()->json([
            'id' => (int) $updated['id'],
            'label' => (string) $updated['label'],
            'sheet_cell' => $updated['sheet_cell'] ?? null,
            'gas_synced' => (bool) ($updated['gas_synced'] ?? false),
            'updated_at' => (string) ($updated['updated_at'] ?? ''),
        ]);
    }
}

