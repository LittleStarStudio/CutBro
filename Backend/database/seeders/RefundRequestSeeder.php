<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\RefundRequest;
use App\Models\Booking;
use App\Models\Barbershop;
use App\Models\Barber;
use App\Models\Service;
use App\Models\User;
use Carbon\Carbon;

class RefundRequestSeeder extends Seeder
{
    public function run(): void
    {
        $shop     = Barbershop::where('slug', 'little-star-barbershop')->first();
        $barber   = Barber::where('barbershop_id', $shop->id)->first();
        $service  = Service::where('barbershop_id', $shop->id)->first();
        $customer = User::whereHas('role', fn($q) => $q->where('name', 'customer'))->first();

        if (!$shop || !$barber || !$service || !$customer) {
            $this->command->warn('Missing required data. Skipping RefundRequestSeeder.');
            return;
        }

        // Cari cancelled booking yang belum punya refund request
        $cancelledBooking = Booking::where('barbershop_id', $shop->id)
            ->where('status', 'cancelled')
            ->doesntHave('refundRequest')
            ->first();

        // Jika tidak ada, buat sendiri
        if (!$cancelledBooking) {
            $cancelledBooking = Booking::create([
                'barbershop_id' => $shop->id,
                'customer_id'   => $customer->id,
                'barber_id'     => $barber->id,
                'service_id'    => $service->id,
                'booking_date'  => Carbon::now()->subDays(3)->toDateString(),
                'start_time'    => '09:00:00',
                'end_time'      => '09:30:00',
                'total_price'   => $service->price,
                'status'        => 'cancelled',
            ]);
            $this->command->info('RefundRequestSeeder: Created 1 cancelled booking for testing.');
        }

        RefundRequest::create([
            'transaction_type' => 'booking',
            'booking_id'       => $cancelledBooking->id,
            'barbershop_id'    => $shop->id,
            'requested_by'     => $cancelledBooking->customer_id,
            'reason'           => 'Barber was late, I had to cancel my appointment',
            'refund_amount'    => $cancelledBooking->total_price,
            'status'           => 'owner_pending',
        ]);

        $this->command->info('RefundRequestSeeder: 1 refund request (owner_pending) created.');
    }
}