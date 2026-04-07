<?php

namespace App\Console\Commands;

use App\Models\OwnerSubscription;
use Carbon\Carbon;
use Illuminate\Console\Command;

class ExpireSubscriptions extends Command
{
    protected $signature   = 'subscriptions:expire';
    protected $description = 'Mark expired subscriptions as expired and reset barbershop plan to free';

    public function handle(): void
    {
        $now = Carbon::now();

        $expired = OwnerSubscription::with('barbershop')
            ->where('status', 'active')
            ->whereNotNull('expired_at')
            ->where('expired_at', '<=', $now)
            ->get();

        $count = 0;

        foreach ($expired as $sub) {
            $sub->update(['status' => 'expired']);

            if ($sub->barbershop) {
                $sub->barbershop->update(['subscription_plan' => 'free']);
            }

            $count++;
        }

        $this->info("Expired {$count} subscription(s).");
    }
}
