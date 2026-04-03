<?php

namespace App\Services;

use App\Models\Barber;
use App\Models\Shift;
use App\Models\BarberShiftAssignment;

class BarberShiftService
{
    public function assignShift(Barber $barber, int $shiftId, int $dayOfWeek)
    {
        if ($dayOfWeek < 0 || $dayOfWeek > 6) {
            abort(400, 'Invalid day of week');
        }

        $shift = Shift::where('id', $shiftId)
            ->where('barbershop_id', $barber->barbershop_id)
            ->where('status', 'active')
            ->firstOrFail();

        return BarberShiftAssignment::updateOrCreate(
            [
                'barber_id' => $barber->id,
                'day_of_week' => $dayOfWeek
            ],
            [
                'shift_id' => $shift->id
            ]
        );
    }
}