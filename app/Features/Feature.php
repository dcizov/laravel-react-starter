<?php

namespace App\Features;

/**
 * A feature the starter kit can include: landing page, newsletter, integrations, and so on.
 *
 * Each feature lives in its own folder under app/Features, with a provider that registers its routes,
 * migrations and anything else it needs. A feature is only loaded when its slug is in FEATURES
 * (see config/features.php). Switching a feature off removes its routes, pages and menu entries.
 */
abstract class Feature
{
    /**
     * The short name used in FEATURES and in the commands, for example "landing".
     */
    abstract public static function slug(): string;

    /**
     * The name shown in the feature list.
     */
    abstract public static function label(): string;

    /**
     * The service providers that make the feature work. They are registered only while it is enabled.
     *
     * @return list<class-string>
     */
    abstract public static function providers(): array;

    /**
     * Other features this one needs, by slug. They must be enabled as well.
     *
     * @return list<string>
     */
    public static function dependsOn(): array
    {
        return [];
    }
}
