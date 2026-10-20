<?php

namespace App\Support;

use Illuminate\Support\Facades\File;

final class Locales
{
    public const DEFAULT = 'en';

    /**
     * Languages the app can be shown in, keyed by locale code.
     *
     * @var array<string, string>
     */
    public const SUPPORTED = [
        'en' => 'English',
        'de' => 'Deutsch',
    ];

    /**
     * @return list<string>
     */
    public static function codes(): array
    {
        return array_keys(self::SUPPORTED);
    }

    /**
     * @return list<array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            fn (string $code, string $label) => ['value' => $code, 'label' => $label],
            array_keys(self::SUPPORTED),
            self::SUPPORTED,
        );
    }

    /**
     * Map a stored locale to a supported one. Unknown or empty values fall back to English.
     */
    public static function resolve(?string $locale): string
    {
        return in_array($locale, self::codes(), true) ? $locale : self::DEFAULT;
    }

    /**
     * Translation strings for the frontend, from lang/{locale}.json.
     *
     * @return array<string, string>
     */
    public static function translations(string $locale): array
    {
        $path = lang_path($locale.'.json');

        return File::exists($path)
            ? json_decode(File::get($path), true, 512, JSON_THROW_ON_ERROR)
            : [];
    }
}
