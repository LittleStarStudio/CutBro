<?php

namespace App\Console\Commands;

use App\Models\OwnerSubscription;
use Carbon\Carbon;
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
