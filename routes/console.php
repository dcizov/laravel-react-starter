<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Scheduled pages go live on their own slot, not on the next save.
Schedule::command('pages:publish-scheduled')->everyMinute()->withoutOverlapping();
