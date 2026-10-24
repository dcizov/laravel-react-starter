<!DOCTYPE html>
<html
    lang="{{ str_replace('_', '-', app()->getLocale()) }}"
    @class(['dark' => ($appearanceResolved ?? 'light') === 'dark'])
    data-appearance="{{ $appearance ?? 'system' }}"
    data-appearance-resolved="{{ $appearanceResolved ?? 'light' }}"
>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        {{--
            Inline script that applies the live light/dark decision before the
            first paint.

            The server already wrote its own decision into the html element (the
            `dark` class and the `data-appearance*` attributes) and React reads
            the same attributes to seed its store, so server and client agree.
            What the server cannot know is the OS preference behind `system`, so
            this script corrects the class for the *current* visit and records
            the answer in a cookie, which makes the next server render match the
            browser without touching the attributes React hydrates from.
        --}}
        <script nonce="{{ Vite::cspNonce() }}">
            (function() {
                const appearance = {{ Illuminate\Support\Js::from($appearance ?? 'system') }};
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const isDark = appearance === 'dark' || (appearance === 'system' && prefersDark);

                document.documentElement.classList.toggle('dark', isDark);
                document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';

                const resolved = isDark ? 'dark' : 'light';

                if ({{ Illuminate\Support\Js::from($appearanceResolved ?? 'light') }} !== resolved) {
                    document.cookie = 'appearance_resolved=' + resolved + ';path=/;max-age=31536000;SameSite=Lax';
                }
            })();
        </script>

        {{-- Inline style to set the HTML background color based on our theme in app.css --}}
        <style nonce="{{ Vite::cspNonce() }}">
            html {
                background-color: oklch(1 0 0);
            }

            html.dark {
                background-color: oklch(0.145 0 0);
            }
        </style>

        <link rel="icon" href="/favicon.ico" sizes="any">
        <link rel="icon" href="/favicon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/apple-touch-icon.png">

        @viteReactRefresh
        @vite(['resources/css/app.css', 'resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        <x-inertia::head>
            <title>{{ config('app.name', 'Laravel') }}</title>
        </x-inertia::head>
    </head>
    <body class="font-sans antialiased">
        <x-inertia::app />
    </body>
</html>
