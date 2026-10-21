<?php

namespace App\Features\Integrations;

/**
 * The third-party tools an admin can connect. Add an entry here to offer another one.
 *
 * Each field is one value the tool needs. Fields marked secret are encrypted when saved, and are never
 * sent back to the browser.
 */
final class Catalogue
{
    /**
     * @return list<array{key: string, name: string, description: string, fields: list<array{key: string, label: string, secret: bool}>}>
     */
    public static function all(): array
    {
        return [
            [
                'key' => 'stripe',
                'name' => 'Stripe',
                'description' => __('Accept card and wallet payments.'),
                'fields' => [
                    ['key' => 'publishable_key', 'label' => __('Publishable key'), 'secret' => false],
                    ['key' => 'secret_key', 'label' => __('Secret key'), 'secret' => true],
                ],
            ],
            [
                'key' => 'mailchimp',
                'name' => 'Mailchimp',
                'description' => __('Sync newsletter subscribers to an audience.'),
                'fields' => [
                    ['key' => 'api_key', 'label' => __('API key'), 'secret' => true],
                    ['key' => 'audience_id', 'label' => __('Audience ID'), 'secret' => false],
                ],
            ],
            [
                'key' => 'postmark',
                'name' => 'Postmark',
                'description' => __('Send transactional email.'),
                'fields' => [
                    ['key' => 'server_token', 'label' => __('Server token'), 'secret' => true],
                ],
            ],
            [
                'key' => 'slack',
                'name' => 'Slack',
                'description' => __('Post alerts and sign-ups to a channel.'),
                'fields' => [
                    ['key' => 'webhook_url', 'label' => __('Webhook URL'), 'secret' => true],
                ],
            ],
            [
                'key' => 'github',
                'name' => 'GitHub',
                'description' => __('Link issues and releases to your project.'),
                'fields' => [
                    ['key' => 'access_token', 'label' => __('Access token'), 'secret' => true],
                ],
            ],
            [
                'key' => 'google-analytics',
                'name' => 'Google Analytics',
                'description' => __('Measure visits and conversions.'),
                'fields' => [
                    ['key' => 'measurement_id', 'label' => __('Measurement ID'), 'secret' => false],
                    ['key' => 'api_secret', 'label' => __('API secret'), 'secret' => true],
                ],
            ],
        ];
    }

    /**
     * @return array{key: string, name: string, description: string, fields: list<array{key: string, label: string, secret: bool}>}|null
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
