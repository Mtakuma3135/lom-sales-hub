<?php

namespace App\Http\Controllers;

use App\Http\Requests\MypageIntegrationUpdateRequest;
use App\Support\UserIntegrationSchema;
use Illuminate\Http\JsonResponse;

class MypageIntegrationController extends Controller
{
    public function update(MypageIntegrationUpdateRequest $request): JsonResponse
    {
        UserIntegrationSchema::ensureUsersTableColumns();

        $user = $request->user();
        if (! $user) {
            abort(401);
        }

        $validated = $request->validated();

        if (! empty($validated['clear_kot_personal'])) {
            $user->kot_personal_api_token = null;
        } elseif (array_key_exists('kot_personal_api_token', $validated)) {
            $v = $validated['kot_personal_api_token'];
            $user->kot_personal_api_token = ($v === null || $v === '') ? null : (string) $v;
        }

        if (! empty($validated['clear_discord_personal'])) {
            $user->personal_discord_webhook_url = null;
        } elseif (array_key_exists('personal_discord_webhook_url', $validated)) {
            $v = $validated['personal_discord_webhook_url'];
            $user->personal_discord_webhook_url = ($v === null || $v === '') ? null : trim((string) $v);
        }

        if (array_key_exists('extra_integrations', $validated)) {
            $raw = $validated['extra_integrations'];
            if ($raw === null) {
                $user->extra_integrations = [];
            } else {
                $existing = $user->extra_integrations;
                $existingList = [];
                if (is_iterable($existing)) {
                    foreach ($existing as $ex) {
                        if (is_array($ex)) {
                            $existingList[] = $ex;
                        }
                    }
                }
                $byKey = [];
                foreach ($existingList as $ex) {
                    $lk = trim((string) ($ex['label'] ?? ''))."\0".trim((string) ($ex['token_label'] ?? ''));
                    $byKey[$lk] = $ex;
                }
                $clean = [];
                foreach ($raw as $row) {
                    if (! is_array($row)) {
                        continue;
                    }
                    $lk = trim((string) ($row['label'] ?? ''))."\0".trim((string) ($row['token_label'] ?? ''));
                    $tv = (string) ($row['token_value'] ?? '');
                    if ($tv === '' && isset($byKey[$lk]) && trim((string) ($byKey[$lk]['token_value'] ?? '')) !== '') {
                        $tv = (string) $byKey[$lk]['token_value'];
                    }
                    $clean[] = [
                        'label' => trim((string) ($row['label'] ?? '')),
                        'token_label' => trim((string) ($row['token_label'] ?? '')),
                        'token_value' => $tv,
                    ];
                }
                $user->extra_integrations = $clean;
            }
        }

        $user->save();

        return response()->json(['ok' => true]);
    }
}
