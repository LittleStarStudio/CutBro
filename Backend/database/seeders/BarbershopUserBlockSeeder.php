<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\BarbershopUserBlock;
use App\Models\Booking;
use App\Models\Barbershop;

class BarbershopUserBlockSeeder extends Seeder
{
    public function run(): void
    {
        $shop = Barbershop::first();

        // Ambil customer yang sudah pernah booking di shop ini
        $booking = Booking::where('barbershop_id', $shop->id)
            ->whereHas('customer')
            ->inRandomOrder()
            ->first();

        if (!$booking) {
            $this->command->warn('No bookings found for this shop. Skipping block seeder.');
            return;
        }

        $customer = $booking->customer;

        BarbershopUserBlock::updateOrCreate(
            [
                'barbershop_id' => $shop->id,
                'user_id'       => $customer->id,
            ],
            [
                'reason' => 'Frequent no show',
            ]
        );
    }
}
