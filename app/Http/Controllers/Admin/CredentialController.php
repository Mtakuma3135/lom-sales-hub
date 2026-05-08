<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CredentialUpdateRequest;
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

    public function syncFromGas(CredentialService $credentialService): JsonResponse
    {
        $this->authorize('viewAny', Credential::class);

        dispatch(function () use ($credentialService): void {
            $credentialService->importFromGas();
        })->afterResponse();

        return response()->json(['data' => ['queued' => true]]);
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
