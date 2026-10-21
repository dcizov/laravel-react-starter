<?php

namespace App\Features\Newsletter\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $email
 * @property string $status
 * @property string $token
 * @property \Illuminate\Support\Carbon|null $subscribed_at
 * @property \Illuminate\Support\Carbon|null $unsubscribed_at
 */
class NewsletterSubscriber extends Model
{
    public const SUBSCRIBED = 'subscribed';

    public const UNSUBSCRIBED = 'unsubscribed';

    protected $table = 'newsletter_subscribers';

    protected $fillable = [
        'email',
        'status',
        'token',
        'subscribed_at',
        'unsubscribed_at',
    ];

    /**
     * The token is only used in unsubscribe links, so it is kept out of JSON responses.
     *
     * @var list<string>
     */
    protected $hidden = [
        'token',
    ];

    protected function casts(): array
    {
        return [
            'subscribed_at' => 'datetime',
            'unsubscribed_at' => 'datetime',
        ];
    }

    public function isSubscribed(): bool
    {
        return $this->status === self::SUBSCRIBED;
    }
}
