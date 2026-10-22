<?php

namespace App\Providers;

use App\Models\User;
use App\Support\Sites\CurrentSite;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
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
        // One per request, so each request chooses its own site (see App\Http\Middleware\ResolveSite).
        $this->app->scoped(CurrentSite::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();

        // A permission granted by one of the user's roles passes any Gate check with that name.
        // Anything else returns null, so policies still decide.
        Gate::before(function (?User $user, string $ability): ?bool {
            return $user?->getAllPermissions()->contains('name', $ability) ? true : null;
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
