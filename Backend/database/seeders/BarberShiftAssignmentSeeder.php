<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Barbershop;
use App\Models\Barber;
use App\Models\Shift;
use App\Models\BarberShiftAssignment;

class BarberShiftAssignmentSeeder extends Seeder
{
    public function run(): void
    {
        $shop1 = Barbershop::where('slug', 'little-star-barbershop')->first();

        if (!$shop1) {
            $this->command->warn('Shop1 not found. Skipping BarberShiftAssignmentSeeder.');
            return;
        }

        $morning   = Shift::where('barbershop_id', $shop1->id)->where('name', 'Morning Shift')->first();
        $afternoon = Shift::where('barbershop_id', $shop1->id)->where('name', 'Afternoon Shift')->first();

        if (!$morning || !$afternoon) {
            $this->command->warn('Shifts not found. Run ShiftSeeder first.');
            return;
        }

        // Ambil barber berdasarkan email user-nya
        $barber1A = Barber::whereHas('user', fn($q) => $q->where('email', 'andi@demo.com'))->first();
        $barber1B = Barber::whereHas('user', fn($q) => $q->where('email', 'budi@demo.com'))->first();

        if (!$barber1A || !$barber1B) {
            $this->command->warn('Barbers not found. Run UserSeeder first.');
            return;
        }

        // Assign semua hari (0=Minggu s/d 6=Sabtu)
        for ($day = 0; $day <= 6; $day++) {
            // Andi → Morning Shift, semua hari
            BarberShiftAssignment::updateOrCreate(
                ['barber_id' => $barber1A->id, 'day_of_week' => $day],
                ['shift_id' => $morning->id, 'status' => 'active']
            );

            // Budi → Afternoon Shift, semua hari
            BarberShiftAssignment::updateOrCreate(
                ['barber_id' => $barber1B->id, 'day_of_week' => $day],
                ['shift_id' => $afternoon->id, 'status' => 'active']
            );
        }

        $this->command->info('BarberShiftAssignmentSeeder: 14 assignments created (2 barbers x 7 days).');
    }
}
