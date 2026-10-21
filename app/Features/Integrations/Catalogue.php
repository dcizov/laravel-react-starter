<?php

namespace App\Features\Integrations;

/**
 * The third-party tools an admin can connect.
 *
 * Two ways to connect:
 * - 'token': the admin pastes the values the tool needs. Fields marked secret are encrypted when saved,
 *   and are never sent back to the browser.
 * - 'oauth': the admin signs in with the provider and grants the listed scopes. No values are typed in;
 *   the provider's client ID and secret come from the environment (see config/services.php).
 */
final class Catalogue
{
    /**
     * @return list<array{key: string, name: string, description: string, favicon: string, auth: string, fields: list<array{key: string, label: string, secret: bool}>, scopes: list<string>}>
     */
    public static function all(): array
    {
        return [
            [
                'key' => 'github',
                'name' => 'GitHub',
                'description' => __('Link issues and releases to your project.'),
                'favicon' => 'github.com',
                'auth' => 'token',
                'fields' => [
                    ['key' => 'access_token', 'label' => __('Access token'), 'secret' => true],
                ],
                'scopes' => [],
            ],
            [
                'key' => 'gmail',
                'name' => 'Gmail',
                'description' => __('Read and send email from your Google account.'),
                'favicon' => 'mail.google.com',
                'auth' => 'oauth',
                'fields' => [],
                'scopes' => [
                    'https://www.googleapis.com/auth/gmail.readonly',
                    'https://www.googleapis.com/auth/gmail.send',
                ],
            ],
            [
                'key' => 'google-calendar',
                'name' => 'Google Calendar',
                'description' => __('See and manage events in your Google calendars.'),
                'favicon' => 'calendar.google.com',
                'auth' => 'oauth',
                'fields' => [],
                'scopes' => [
                    'https://www.googleapis.com/auth/calendar.events',
                ],
            ],
        ];
    }

    /**
     * @return array{key: string, name: string, description: string, favicon: string, auth: string, fields: list<array{key: string, label: string, secret: bool}>, scopes: list<string>}|null
     */
    public static function find(string $key): ?array
    {
        foreach (self::all() as $integration) {
            if ($integration['key'] === $key) {
                return $integration;
            }
        }

        return null;
    }
}
