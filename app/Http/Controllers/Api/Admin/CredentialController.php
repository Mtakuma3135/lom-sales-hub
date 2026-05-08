<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Admin\CredentialUpdateRequest;
use App\Http\Resources\CredentialResource;
use App\Models\Credential;
use App\Services\CredentialService;
use Illuminate\Http\JsonResponse;

class CredentialController extends Controller
{
    public function index(CredentialService $credentialService): JsonResponse
    {
        $this->authorize('viewAny', Credential::class);

        $items = $credentialService->index();

        return CredentialResource::collection($items)->response();
    }

    public function update(CredentialUpdateRequest $request, CredentialService $credentialService, int $id): JsonResponse
    {
        $credential = new Credential(['id' => $id]);
        $this->authorize('update', $credential);

        $result = $credentialService->update(
            $id,
            $request->loginId(),
            $request->password(),
            $request->updatedAt(),
        );

        return CredentialResource::make($result['credential'])
            ->additional([
                'gas_synced' => $result['gas_synced'] ?? null,
                'gas_queued' => (bool) ($result['gas_queued'] ?? false),
            ])
            ->response();
    }
}
