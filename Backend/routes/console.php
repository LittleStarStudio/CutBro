<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('app:expire-unpaid-bookings')->everyMinute();
Schedule::command('subscriptions:expire')->dailyAt('00:00');
Schedule::command('subscriptions:notify-expiry')->dailyAt('08:00');
