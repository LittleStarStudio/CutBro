<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\OperationalHour;
use App\Models\Barbershop;

class OperationalHourSeeder extends Seeder
{
    public function run(): void
    {
        $barbershops = Barbershop::all();

        foreach ($barbershops as $shop) {
            // 0 = Sunday, 1 = Monday ... 6 = Saturday
            for ($day = 0; $day <= 6; $day++) {
                OperationalHour::updateOrCreate(
                    [
                        'barbershop_id' => $shop->id,
                        'day_of_week' => $day,
                    ],
                    [
                        'open_time' => '09:00:00',
                        'close_time' => '21:00:00',
                        'is_closed' => false,
                    ]
                );
            }
        }
    }
}