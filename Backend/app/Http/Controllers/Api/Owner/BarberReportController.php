<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\Barber;
use App\Models\Booking;
use Illuminate\Http\Request;

class BarberReportController extends Controller
{
    public function index(Request $request)
    {
        $barbershopId = $request->user()->barbershop_id;

        $barbers = Barber::with('user')
            ->where('barbershop_id', $barbershopId)
            ->get()
            ->map(function ($barber) use ($barbershopId) {
                $lastBooking = Booking::where('barbershop_id', $barbershopId)
                    ->where('barber_id', $barber->id)
                    ->max('booking_date');

                return [
                    'id'               => $barber->id,
                    'barber_name'      => $barber->name,
                    'account'          => $barber->user?->email ?? '-',
                    'join_date'        => $barber->created_at?->format('Y-m-d'),
                    'last_active_date' => $lastBooking ?? $barber->created_at?->format('Y-m-d'),
                    'status'           => 'Active',
                ];
            });

        return response()->json(['success' => true, 'data' => $barbers]);
    }
}
