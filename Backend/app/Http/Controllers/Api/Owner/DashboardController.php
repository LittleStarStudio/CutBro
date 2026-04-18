<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Barber;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $barbershopId = $request->user()->barbershop_id;

        $totalBooking   = Booking::where('barbershop_id', $barbershopId)->count();
        $totalCustomer  = Booking::where('barbershop_id', $barbershopId)
            ->distinct('customer_id')->count('customer_id');
        $totalBarber    = Barber::where('barbershop_id', $barbershopId)->count();
        $totalBalance   = Booking::where('barbershop_id', $barbershopId)
            ->whereIn('status', ['paid', 'done'])
            ->sum('total_price');

        // Monthly salary data: sum of paid bookings grouped by month (current year)
        $year = now()->year;
        $monthly = Booking::where('barbershop_id', $barbershopId)
            ->whereIn('status', ['paid', 'done'])
            ->whereYear('booking_date', $year)
            ->select(
                DB::raw('MONTH(booking_date) as month_num'),
                DB::raw('SUM(total_price) as amount')
            )
            ->groupBy('month_num')
            ->orderBy('month_num')
            ->get()
            ->keyBy('month_num');

        $monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        $monthlySalary = [];
        foreach ($monthNames as $i => $name) {
            $monthlySalary[] = [
                'month'  => $name,
                'amount' => (int) ($monthly->get($i + 1)?->amount ?? 0),
            ];
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'stats' => [
                    'total_booking'  => $totalBooking,
                    'total_customer' => $totalCustomer,
                    'total_barber'   => $totalBarber,
                    'total_balance'  => (int) $totalBalance,
                ],
                'monthly_salary' => $monthlySalary,
            ],
        ]);
    }
}
