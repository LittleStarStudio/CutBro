<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Barbershop;
use App\Models\Shift;

class ShiftSeeder extends Seeder
{
    public function run(): void
    {
        $shop1 = Barbershop::where('slug', 'little-star-barbershop')->first();

        if (!$shop1) {
            $this->command->warn('Shop1 not found. Skipping ShiftSeeder.');
            return;
        }

        Shift::updateOrCreate(
            ['barbershop_id' => $shop1->id, 'name' => 'Morning Shift'],
            ['start_time' => '08:00:00', 'end_time' => '12:00:00', 'status' => 'active']
        );

        Shift::updateOrCreate(
            ['barbershop_id' => $shop1->id, 'name' => 'Afternoon Shift'],
            ['start_time' => '13:00:00', 'end_time' => '17:00:00', 'status' => 'active']
        );

        $this->command->info('ShiftSeeder: 2 shifts created for Little Star Barbershop.');
    }
}
