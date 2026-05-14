<?php

namespace App\Providers;

use App\Events\CsvImportCompleted;
use App\Events\KotPunchRecorded;
use App\Events\LunchBreakScheduleUpdated;
use App\Listeners\QueueDiscordNotificationOnCsvImportCompleted;
use App\Listeners\QueueDiscordNotificationOnKotPunchRecorded;
use App\Listeners\QueueDiscordNotificationOnLunchBreakScheduleUpdated;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        App::setLocale((string) config('app.locale', 'ja'));

        Vite::prefetch(concurrency: 3);

        if (config('lom.force_https')) {
            URL::forceScheme('https');
        }

        Event::listen(CsvImportCompleted::class, QueueDiscordNotificationOnCsvImportCompleted::class);
        Event::listen(LunchBreakScheduleUpdated::class, QueueDiscordNotificationOnLunchBreakScheduleUpdated::class);
        Event::listen(KotPunchRecorded::class, QueueDiscordNotificationOnKotPunchRecorded::class);
    }
}
