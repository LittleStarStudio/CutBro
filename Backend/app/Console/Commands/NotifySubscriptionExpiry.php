<?php

namespace App\Console\Commands;

use Carbon\Carbon;

use App\Models\OwnerSubscription;
use App\Models\Notification;
use App\Models\User;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;

class NotifySubscriptionExpiry extends Command
{
    protected $signature   = 'subscriptions:notify-expiry';
    protected $description = 'Send email notifications to owners whose subscription expires in 7 or 1 day(s)';

    public function handle(): void
    {
        $today = Carbon::today();

        $subscriptions = OwnerSubscription::with(['barbershop.users', 'plan'])
            ->where('status', 'active')
            ->whereNotNull('expired_at')
            ->get()
            ->filter(function ($sub) use ($today) {
                $daysLeft = $today->diffInDays($sub->expired_at, false);
                return in_array($daysLeft, [7, 1]);
            });

        foreach ($subscriptions as $sub) {
            $owner = $sub->barbershop->users()
                ->whereHas('role', fn($q) => $q->where('name', 'owner'))
                ->first();

            if (! $owner) continue;

            $daysLeft = $today->diffInDays($sub->expired_at, false);

            // Kirim in-app notification hanya untuk H-7
            if ($daysLeft === 7) {
                $alreadySent = Notification::where('user_id', $owner->id)
                    ->where('type', 'subscription_expiring')
                    ->whereJsonContains('data->subscription_id', $sub->id)
                    ->where('created_at', '>=', now()->subDay())
                    ->exists();

                if (! $alreadySent) {
                    Notification::create([
                        'user_id' => $owner->id,
                        'type'    => 'subscription_expiring',
                        'title'   => 'Subscription Expiring Soon',
                        'body'    => "Your {$sub->plan->display_name} subscription will expire on {$sub->expired_at->format('d M Y')} (7 days left). Renew now to continue enjoying all features.",
                        'data'    => [
                            'subscription_id' => $sub->id,
                            'plan_name'       => $sub->plan->name,
                            'expired_at'      => $sub->expired_at->toDateString(),
                            'days_left'       => 7,
                        ],
                    ]);
                }
            }

            Mail::send([], [], function ($message) use ($owner, $sub, $daysLeft) {
                $message
                    ->to($owner->email, $owner->name)
                    ->subject("CutBro: Your {$sub->plan->display_name} plan expires in {$daysLeft} day(s)")
                    ->html(
                        "<p>Hi {$owner->name},</p>" .
                        "<p>Your <strong>{$sub->plan->display_name}</strong> subscription will expire on " .
                        "<strong>{$sub->expired_at->format('d M Y')}</strong> ({$daysLeft} day(s) left).</p>" .
                        "<p>Please renew your plan to keep enjoying CutBro's features.</p>" .
                        "<p>— The CutBro Team</p>"
                    );
            });

            $this->info("Notified: {$owner->email} ({$daysLeft} days left)");
        }

        $this->info('Done. Total notified: ' . $subscriptions->count());
    }
}
