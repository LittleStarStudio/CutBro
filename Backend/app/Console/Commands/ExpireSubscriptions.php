<?php

namespace App\Console\Commands;

use App\Models\OwnerSubscription;
use App\Models\Notification;           // ← tambah
use App\Models\User;

use Carbon\Carbon;
use Illuminate\Console\Command;

class ExpireSubscriptions extends Command
{
    protected $signature   = 'subscriptions:expire';
    protected $description = 'Mark expired subscriptions as expired and reset barbershop plan to free';

    public function handle(): void
    {
        $now = Carbon::now();

        $expired = OwnerSubscription::with(['barbershop', 'plan'])
            ->where('status', 'active')
            ->whereNotNull('expired_at')
            ->where('expired_at', '<=', $now)
            ->get();

        $count = 0;

        foreach ($expired as $sub) {
            $sub->update(['status' => 'expired']);

            if ($sub->barbershop) {
                $sub->barbershop->update(['subscription_plan' => 'free']);

                $owner = User::where('barbershop_id', $sub->barbershop_id)
                    ->whereHas('role', fn($q) => $q->where('name', 'owner'))
                    ->first();

                if ($owner) {
                    Notification::create([
                        'user_id' => $owner->id,
                        'type'    => 'subscription_expired',
                        'title'   => 'Subscription Expired',
                        'body'    => "Your {$sub->plan->display_name} subscription has expired. Renew now to restore your barbershop's full features.",
                        'data'    => [
                            'subscription_id' => $sub->id,
                            'plan_name'       => $sub->plan->name,
                            'expired_at'      => $sub->expired_at->toDateString(),
                        ],
                    ]);
                }
            }

            $count++;
        }

        $this->info("Expired {$count} subscription(s).");
    }
}
