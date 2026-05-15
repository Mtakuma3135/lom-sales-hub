<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\CredentialUpdateRequest;
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

        return CredentialResource::collection($items)->response();
    }

    public function store(Request $request, CredentialService $credentialService): JsonResponse
    {
        $this->authorize('create', Credential::class);

        $validated = $request->validate([
            'service_name' => ['required', 'string', 'max:255'],
        ]);

        $label = trim($validated['service_name']);

        if (Credential::query()->where('label', $label)->exists()) {
            return response()->json([
                'message' => "「{$label}」は既に使用されている項目です。",
            ], 422);
        }

        try {
            $row = Credential::query()->create([
                'label' => $label,
                'login_id' => '',
                'value' => '',
                'is_password' => true,
                'visible_on_credentials_page' => true,
            ]);
        } catch (\Throwable $e) {
            report($e);
            return response()->json(['message' => '追加に失敗しました。'], 500);
        }

        dispatch(function () use ($credentialService): void {
            $credentialService->importFromGas();
        })->afterResponse();

        return CredentialResource::make($row)->response();
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
