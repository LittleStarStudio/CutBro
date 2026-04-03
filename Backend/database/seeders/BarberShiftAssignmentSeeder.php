<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Barber;
use App\Models\Shift;
use App\Models\BarberShiftAssignment;

class BarberShiftAssignmentSeeder extends Seeder
{
    public function run(): void
    {
        foreach (Barber::all() as $barber) {

            $shift = Shift::where('barbershop_id', $barber->barbershop_id)
                ->where('name', 'Morning Shift')
                ->first();

            if (!$shift) {
                continue;
            }

            for ($day = 0; $day <= 6; $day++) {
                BarberShiftAssignment::updateOrCreate(
                    [
                        'barber_id' => $barber->id,
                        'day_of_week' => $day
                    ],
                    [
                        'shift_id' => $shift->id
                    ]
                );
            }
        }
    }
}