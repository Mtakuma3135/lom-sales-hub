<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UserStoreRequest;
use App\Http\Requests\Admin\UserUpdateRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\UserService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

// 管理画面 ユーザー管理コントローラ（指示書準拠）
class UserController extends Controller
{
    /**
     * ユーザー一覧画面
     */
    public function index(UserService $userService): Response
    {
        $this->authorize('viewAny', User::class);

        // 1ページあたり20件でページネーション取得（サービス利用）
        $users = $userService->index(perPage: 20);

        // コレクションリソース形式+meta（空配列でOK）
        $usersResource = UserResource::collection($users)
            ->additional(['meta' => []])
            ->response()
            ->getData(true);

        // InertiaでVue側にデータ渡す（指示通り）
        return Inertia::render('Admin/Users/Index', [
            'users' => $usersResource,
        ]);
    }

    /**
     * ユーザー新規作成（登録）
     */
    public function store(UserStoreRequest $request, UserService $userService): RedirectResponse
    {
        $this->authorize('create', User::class);

        // バリデーション済リクエストパラメータで新規追加
        $userService->store($request->validated());

        // 一覧画面へリダイレクト（ルート名は指示どおり）
        return Redirect::route('admin.users.index');
    }

    public function update(UserUpdateRequest $request, UserService $userService, int $id): RedirectResponse
    {
        $target = User::query()->findOrFail($id);
        $this->authorize('update', $target);

        $userService->update($id, $request->validated());

        return Redirect::route('admin.users.index');
    }

    public function destroy(Request $request, UserService $userService, int $id): RedirectResponse
    {
        $target = User::query()->findOrFail($id);
        $this->authorize('delete', $target);

        if ((int) $id === (int) $request->user()?->id) {
            return Redirect::route('admin.users.index')
                ->with('error', '自分自身は無効化できません。');
        }

        $userService->deactivate($id);

        return Redirect::route('admin.users.index');
    }
}
