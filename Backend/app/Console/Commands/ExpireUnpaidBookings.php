<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Booking;
use Carbon\Carbon;

class ExpireUnpaidBookings extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:expire-unpaid-bookings';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Auto expire unpaid bookings after 30 minutes';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        Booking::where('status', Booking::STATUS_PENDING_PAYMENT)
            ->where('created_at', '<', Carbon::now()->subMinutes(30))
            ->update([
                'status' => Booking::STATUS_EXPIRED
            ]);
    }

}
