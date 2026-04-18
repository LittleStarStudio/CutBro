<?php

namespace App\Http\Controllers\Api\Barber;

use App\Http\Controllers\Api\BaseController;
use App\Models\Booking;
use App\Models\Barber;
use App\Services\BookingService;
use App\Models\Notification;
use Carbon\Carbon;
use Illuminate\Http\Request;

class BookingController extends BaseController
{
    public function __construct(protected BookingService $bookingService) {}

    // GET /barber/bookings/today
    public function today(Request $request)
    {
        $barber = Barber::where('user_id', $request->user()->id)->firstOrFail();
        $today  = Carbon::now('Asia/Jakarta')->toDateString();

        $bookings = Booking::with(['customer', 'service'])
            ->where('barber_id', $barber->id)
            ->whereDate('booking_date', $today)
            ->whereIn('status', ['paid', 'done', 'no_show'])
            ->orderBy('start_time')
            ->get()
            ->map(fn($b) => [
                'id'            => $b->id,
                'start_time'    => $b->start_time,
                'end_time'      => $b->end_time,
                'customer_name' => $b->customer?->name,
                'service_name'  => $b->service?->name,
                'status'        => $b->status,
                'total_price'   => $b->total_price,
            ]);

        return $this->success([
            'stats' => [
                'total'   => $bookings->count(),
                'done'    => $bookings->where('status', 'done')->count(),
                'pending' => $bookings->where('status', 'paid')->count(),
            ],
            'bookings' => $bookings->values(),
        ]);
    }

    // PATCH /barber/bookings/{booking}/done
    public function done(Request $request, Booking $booking)
    {
        $barber = Barber::where('user_id', $request->user()->id)->firstOrFail();

        if ($booking->barber_id !== $barber->id) {
            return $this->error('Unauthorized', 403);
        }

        try {
            $this->bookingService->updateStatus($booking, 'done');
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return $this->error($e->getMessage(), $e->getStatusCode());
        }

        // Kirim notifikasi ke customer
        $booking->load('barbershop', 'service');
        Notification::create([
            'user_id' => $booking->customer_id,
            'type'    => 'booking_done',
            'title'   => 'Booking Completed',
            'body'    => "Your booking at {$booking->barbershop->name} ({$booking->service->name}) has been completed. Thank you!",
            'data'    => ['booking_id' => $booking->id],
        ]);

        return $this->success($booking->fresh(), 'Booking marked as done.');
    }

    // GET /barber/bookings/history
    public function history(Request $request)
    {
        $barber = Barber::where('user_id', $request->user()->id)->firstOrFail();

        $bookings = Booking::with(['customer', 'service'])
            ->where('barber_id', $barber->id)
            ->whereIn('status', ['done', 'no_show', 'cancelled'])
            ->orderBy('booking_date', 'desc')
            ->get()
            ->map(fn($b) => [
                'id'            => $b->id,
                'booking_date'  => $b->booking_date?->format('Y-m-d'),
                'start_time'    => $b->start_time,
                'customer_name' => $b->customer?->name,
                'service_name'  => $b->service?->name,
                'status'        => $b->status,
                'total_price'   => $b->total_price,
            ]);

        return $this->success($bookings->values());
    }
}
