<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\Admin\UserStoreRequest;
use App\Http\Requests\Api\Admin\UserUpdateRequest;
use App\Http\Resources\UserResource;
use App\Services\UserService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UserController extends Controller
{
    public function index(UserService $userService): AnonymousResourceCollection
    {
        $this->authorize('viewAny', \App\Models\User::class);

        $users = $userService->index(perPage: 20);

        return UserResource::collection($users)
            ->additional(['meta' => []]);
    }

    public function store(UserStoreRequest $request, UserService $userService): JsonResponse
    {
        $this->authorize('create', \App\Models\User::class);

        $user = $userService->store($request->validated());

        return (new UserResource($user))
            ->additional(['meta' => []])
            ->response()
            ->setStatusCode(201);
    }

    public function update(UserUpdateRequest $request, UserService $userService, int $id): JsonResponse
    {
        $target = \App\Models\User::query()->findOrFail($id);
        $this->authorize('update', $target);

        $user = $userService->update($id, $request->validated());

        return (new UserResource($user))
            ->additional(['meta' => []])
            ->response()
            ->setStatusCode(200);
    }

    public function destroy(UserService $userService, int $id): JsonResponse
    {
        $target = \App\Models\User::query()->findOrFail($id);
        $this->authorize('delete', $target);

        $user = $userService->deactivate($id);

        return response()->json([
            'message' => 'User deactivated successfully',
            'user' => (new UserResource($user))->toArray(request()),
        ]);
    }
}

