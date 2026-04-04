<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\BarberShiftAssignment;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    private const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

    public function index(Request $request)
    {
        $barbershopId = $request->user()->barbershop_id;

        $assignments = BarberShiftAssignment::with(['barber', 'shift'])
            ->whereHas('barber', fn($q) => $q->where('barbershop_id', $barbershopId))
            ->get()
            ->map(fn($a) => [
                'id'              => $a->id,
                'barber_id'       => $a->barber_id,
                'barber_name'     => $a->barber?->name,
                'day'             => self::DAYS[$a->day_of_week] ?? 'Monday',
                'shift_label'     => $a->shift ? ucfirst($a->shift->name) : null,
                'scheduled_start' => $a->shift ? substr($a->shift->start_time, 0, 5) : null,
                'scheduled_end'   => $a->shift ? substr($a->shift->end_time, 0, 5) : null,
                'actual_checkin'  => null, // attendance tracking belum diimplementasi
                'status'          => $a->status,
            ]);

        return response()->json(['success' => true, 'data' => $assignments]);
    }
}
