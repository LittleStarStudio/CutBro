<?php

namespace App\Http\Controllers\Api\Barber;

use App\Http\Controllers\Api\BaseController;
use App\Models\Barber;
use App\Models\Booking;
use App\Models\Barbershop;  
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends BaseController
{
    public function index(Request $request)
    {
        $barber = Barber::where('user_id', $request->user()->id)->firstOrFail();
        $barbershopName = Barbershop::find($barber->barbershop_id)?->name ?? '—';

        $now  = Carbon::now('Asia/Jakarta');
        $year = $now->year;

        $totalDone = Booking::where('barber_id', $barber->id)->where('status', 'done')->count();

        $thisMonth = Booking::where('barber_id', $barber->id)
            ->where('status', 'done')
            ->whereYear('booking_date', $year)
            ->whereMonth('booking_date', $now->month)
            ->count();

        $monthly = Booking::where('barber_id', $barber->id)
            ->where('status', 'done')
            ->whereYear('booking_date', $year)
            ->select(DB::raw('MONTH(booking_date) as month'), DB::raw('COUNT(*) as customers'))
            ->groupBy('month')
            ->orderBy('month')
            ->get()
            ->keyBy('month');

        $MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        $chartData = collect(range(1, 12))->map(fn($m) => [
            'month'     => $MONTHS[$m - 1],
            'customers' => $monthly->get($m)?->customers ?? 0,
        ])->values();

        $totalYear = $chartData->sum('customers');
        $average   = $now->month > 0 ? round($totalYear / $now->month) : 0;

        $recent = Booking::with(['customer', 'service'])
            ->where('barber_id', $barber->id)
            ->where('status', 'done')
            ->orderBy('booking_date', 'desc')
            ->orderBy('start_time', 'desc')
            ->limit(5)
            ->get()
            ->map(fn($b) => [
                'customer_name' => $b->customer?->name,
                'service_name'  => $b->service?->name,
                'start_time'    => $b->start_time,
                'end_time'      => $b->end_time,
                'booking_date'  => $b->booking_date?->format('Y-m-d'),
                'status'        => $b->status,
            ]);

        return $this->success([
            'workplace'   => $barbershopName,
            'total_done'  => $totalDone,
            'this_month'  => $thisMonth,
            'monthly_avg' => $average,
            'chart'       => $chartData,
            'recent'      => $recent,
        ]);
    }
}
