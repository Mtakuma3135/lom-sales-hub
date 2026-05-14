<?php

namespace App\Services;

use App\Models\Notice;
use App\Models\NoticeRead;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class NoticeService
{
    /**
     * @return Collection<int, Notice>
     */
    public function index(): Collection
    {
        try {
            return Notice::query()
                ->orderByDesc('is_pinned')
                ->orderByDesc('published_at')
                ->get();
        } catch (\Throwable $e) {
            Log::error('NoticeService.index failed', ['error' => $e->getMessage()]);

            return collect();
        }
    }

    /**
     * 下書き一覧（管理者のみ）
     *
     * @return Collection<int, Notice>
     */
    public function drafts(): Collection
    {
        try {
            return Notice::query()
                ->whereNull('published_at')
                ->orderByDesc('is_pinned')
                ->orderByDesc('updated_at')
                ->get();
        } catch (\Throwable $e) {
            Log::error('NoticeService.drafts failed', ['error' => $e->getMessage()]);

            return collect();
        }
    }

    /**
     * @return Collection<int, Notice>
     */
    public function indexFor(User $actor): Collection
    {
        try {
            $q = Notice::query()
                ->orderByDesc('is_pinned')
                ->orderByDesc('published_at');

            if (($actor->role ?? 'general') !== 'admin') {
                $q->whereNotNull('published_at')->where('published_at', '<=', now());
            }

            return $q->get();
        } catch (\Throwable $e) {
            Log::error('NoticeService.indexFor failed', ['error' => $e->getMessage()]);

            return collect();
        }
    }

    /**
     * 下書き一覧（管理者のみ）
     *
     * @return Collection<int, Notice>
     */
    public function draftsFor(User $actor): Collection
    {
        if (($actor->role ?? 'general') !== 'admin') {
            return collect();
        }

        return $this->drafts();
    }

    public function find(int $id): Notice
    {
        return Notice::query()->findOrFail($id);
    }

    public function findFor(User $actor, int $id): Notice
    {
        $q = Notice::query();
        if (($actor->role ?? 'general') !== 'admin') {
            $q->whereNotNull('published_at')->where('published_at', '<=', now());
        }

        return $q->findOrFail($id);
    }

    public function store(string $title, string $body, bool $isPinned, ?string $publishedAt): Notice
    {
        try {
            $notice = Notice::query()->create([
                'title' => $title,
                'body' => $body,
                'is_pinned' => $isPinned,
                'published_at' => $publishedAt,
            ]);

            return $notice;
        } catch (\Throwable $e) {
            Log::error('NoticeService.store failed', ['error' => $e->getMessage()]);
            throw new \RuntimeException('Server error.', 500);
        }
    }

    /**
     * @param  array{title?:string,body?:string,is_pinned?:bool,published_at?:string|null}  $attrs
     */
    public function update(int $id, array $attrs): Notice
    {
        try {
            $notice = Notice::query()->findOrFail($id);

            if (array_key_exists('title', $attrs)) {
                $notice->title = (string) ($attrs['title'] ?? '');
            }
            if (array_key_exists('body', $attrs)) {
                $notice->body = (string) ($attrs['body'] ?? '');
            }
            if (array_key_exists('is_pinned', $attrs)) {
                $notice->is_pinned = (bool) ($attrs['is_pinned'] ?? false);
            }
            if (array_key_exists('published_at', $attrs)) {
                $v = $attrs['published_at'];
                $notice->published_at = $v === null || $v === '' ? null : (string) $v;
            }

            $notice->save();

            return $notice->fresh();
        } catch (\Throwable $e) {
            Log::error('NoticeService.update failed', ['id' => $id, 'error' => $e->getMessage()]);
            throw new \RuntimeException('Server error.', 500);
        }
    }

    public function destroy(int $id): void
    {
        try {
            Notice::query()->where('id', $id)->delete();
        } catch (\Throwable $e) {
            Log::error('NoticeService.destroy failed', ['id' => $id, 'error' => $e->getMessage()]);
            throw new \RuntimeException('Server error.', 500);
        }
    }

    /**
     * @param  Collection<int, Notice>  $notices
     * @return Collection<int, Notice>
     */
    public function attachReadFlags(User $actor, Collection $notices): Collection
    {
        if ($notices->isEmpty() || ! Schema::hasTable('notice_reads')) {
            return $notices;
        }

        $ids = $notices->pluck('id')->filter()->values()->all();
        if ($ids === []) {
            return $notices;
        }

        $readIds = NoticeRead::query()
            ->where('user_id', (int) $actor->id)
            ->whereIn('notice_id', $ids)
            ->pluck('notice_id')
            ->all();
        $readSet = array_fill_keys(array_map('intval', $readIds), true);

        return $notices->map(function (Notice $n) use ($readSet): Notice {
            $n->setAttribute('is_read', isset($readSet[(int) $n->id]));

            return $n;
        })->values();
    }

    public function markRead(User $actor, int $noticeId): void
    {
        if (! Schema::hasTable('notice_reads')) {
            return;
        }

        NoticeRead::query()->updateOrCreate(
            [
                'user_id' => (int) $actor->id,
                'notice_id' => $noticeId,
            ],
            ['read_at' => now()],
        );
    }

    public function markUnread(User $actor, int $noticeId): void
    {
        if (! Schema::hasTable('notice_reads')) {
            return;
        }

        NoticeRead::query()
            ->where('user_id', (int) $actor->id)
            ->where('notice_id', $noticeId)
            ->delete();
    }

    /**
     * 公開済みかつ未読の周知件数（ログインユーザー向け）。
     */
    public function unreadPublishedCount(User $actor): int
    {
        try {
            if (! Schema::hasTable('notice_reads')) {
                return 0;
            }

            $q = Notice::query()
                ->whereNotNull('published_at')
                ->where('published_at', '<=', now());

            if (($actor->role ?? 'general') !== 'admin') {
                $q->whereNotNull('published_at');
            }

            $total = (clone $q)->count();
            if ($total === 0) {
                return 0;
            }

            $readCount = NoticeRead::query()
                ->where('user_id', (int) $actor->id)
                ->whereIn('notice_id', (clone $q)->pluck('id'))
                ->count();

            return max(0, $total - $readCount);
        } catch (\Throwable $e) {
            Log::error('NoticeService.unreadPublishedCount failed', ['error' => $e->getMessage()]);

            return 0;
        }
    }
}
