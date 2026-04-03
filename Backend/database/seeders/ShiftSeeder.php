<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Shift;
use App\Models\Barbershop;

class ShiftSeeder extends Seeder
{
    public function run(): void
    {
        foreach (Barbershop::all() as $shop) {

            Shift::updateOrCreate(
                ['barbershop_id' => $shop->id, 'name' => 'Morning Shift'],
                [
                    'start_time' => '09:00:00',
                    'end_time' => '15:00:00',
                    'status' => 'active'
                ]
            );

            Shift::updateOrCreate(
                ['barbershop_id' => $shop->id, 'name' => 'Evening Shift'],
                [
                    'start_time' => '15:00:00',
                    'end_time' => '21:00:00',
                    'status' => 'active'
                ]
            );
        }
    }
}