<?php

namespace App\Notifications;

use App\Models\Invitation;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class InvitationNotification extends Notification
{
    public function __construct(
        public readonly Invitation $invitation,
        public readonly string $token,
    ) {}

    /**
     * @return list<string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('You are invited to '.config('app.name'))
            ->greeting('Welcome to '.config('app.name'))
            ->line('You have been invited as '.$this->invitation->role.'.')
            ->action('Accept invitation', route('invitations.show', ['token' => $this->token]))
            ->line('This link expires '.$this->invitation->expires_at->diffForHumans().'.')
            ->line('If you were not expecting this invitation, you can ignore this email.');
    }
}
