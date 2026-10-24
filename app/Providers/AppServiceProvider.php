<?php

declare(strict_types=1);

namespace App\Providers;

use App\Cms\Media\MediaLibrary;
use App\Models\Media;
use App\Models\Page;
use App\Models\User;
use App\Policies\MediaPolicy;
use App\Policies\PagePolicy;
use App\Policies\UserPolicy;
use Carbon\CarbonImmutable;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

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
        $this->configureDefaults();
        $this->registerPolicies();
        $this->registerEventListeners();
        $this->trackMediaUsages();
    }

    /**
     * Explicit mappings beat policy guessing when classes live outside the
     * default namespace.
     */
    private function registerPolicies(): void
    {
        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(Page::class, PagePolicy::class);
        Gate::policy(Media::class, MediaPolicy::class);
    }

    /**
     * The media usage table is derived state: every write path of a page
     * refreshes it, so "where is this image used?" is answered from the
     * database instead of by re-scanning every page on read.
     */
    private function trackMediaUsages(): void
    {
        $sync = function (Page $page): void {
            app(MediaLibrary::class)->syncUsages($page);
        };

        Page::saved($sync);
        Page::restored($sync);

        Page::deleted(function (Page $page): void {
            app(MediaLibrary::class)->forgetUsages($page);
        });
    }

    /**
     * Auth events feed the audit trail and the "last seen" column.
     */
    private function registerEventListeners(): void
    {
        Event::listen(Login::class, function (Login $event): void {
            if ($event->user instanceof User) {
                $event->user->forceFill(['last_login_at' => now()])->saveQuietly();
            }
        });
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }
}
