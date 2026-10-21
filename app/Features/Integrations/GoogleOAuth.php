<?php

namespace App\Features\Integrations;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Google sign-in for the Gmail and Google Calendar integrations.
 *
 * Uses the standard OAuth 2.0 authorisation code flow over plain HTTP, so no extra package is needed.
 * Requires GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET, and the callback URL added to the Google Cloud
 * OAuth client as an authorised redirect URI.
 */
final class GoogleOAuth
{
    private const AUTHORIZE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

    private const TOKEN_URL = 'https://oauth2.googleapis.com/token';

    private const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';

    public function configured(): bool
    {
        return filled(config('services.google.client_id')) && filled(config('services.google.client_secret'));
    }

    public function redirectUri(): string
    {
        return route('admin.integrations.oauth.callback');
    }

    /**
     * The Google sign-in page for one integration. The state value protects against forged callbacks.
     */
    public function authorizationUrl(array $scopes, string $state): string
    {
        return self::AUTHORIZE_URL.'?'.http_build_query([
            'client_id' => config('services.google.client_id'),
            'redirect_uri' => $this->redirectUri(),
            'response_type' => 'code',
            'scope' => implode(' ', $scopes),
            'access_type' => 'offline',
            // Asks for consent every time, so Google always returns a refresh token.
            'prompt' => 'consent',
            'include_granted_scopes' => 'true',
            'state' => $state,
        ]);
    }

    /**
     * Exchanges the code from the callback for tokens. Returns the refresh token, or null if the exchange failed.
     */
    public function exchangeCode(string $code): ?string
    {
        $response = $this->post(self::TOKEN_URL, [
            'code' => $code,
            'client_id' => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
            'redirect_uri' => $this->redirectUri(),
            'grant_type' => 'authorization_code',
        ]);

        if ($response === null || ! $response->successful()) {
            return null;
        }

        $refreshToken = $response->json('refresh_token');

        return is_string($refreshToken) && $refreshToken !== '' ? $refreshToken : null;
    }

    /**
     * Revokes a refresh token at Google. Returns false if Google could not be reached or refused it.
     * The local connection is removed either way, so a failed revoke never leaves a connected account behind.
     */
    public function revoke(string $refreshToken): bool
    {
        $response = $this->post(self::REVOKE_URL, ['token' => $refreshToken]);

        return $response !== null && $response->successful();
    }

    public static function newState(): string
    {
        return Str::random(40);
    }

    private function post(string $url, array $data): ?\Illuminate\Http\Client\Response
    {
        try {
            return Http::asForm()->timeout(10)->post($url, $data);
        } catch (ConnectionException $exception) {
            Log::warning('Google OAuth request failed.', ['url' => $url, 'message' => $exception->getMessage()]);

            return null;
        }
    }
}
