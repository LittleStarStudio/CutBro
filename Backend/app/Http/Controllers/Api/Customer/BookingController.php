<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Api\BaseController;
use App\Services\BookingService;
use App\Models\Booking;
use Illuminate\Http\Request;

class BookingController extends BaseController
{
    public function __construct(
        protected BookingService $bookingService
    ) {}

    public function store(Request $request)
    {
        $data = $request->validate([
            'service_id'   => 'required|exists:services,id',
            'barber_id'    => 'required|exists:barbers,id',
            'booking_date' => 'required|date_format:Y-m-d',
            'start_time'   => 'required|date_format:H:i'
        ]);

        $booking = $this->bookingService->create($data);

        return $this->success($booking);
    }

    public function availableSlots(Request $request)
    {
        $data = $request->validate([
            'service_id'   => 'required|exists:services,id',
            'barber_id'    => 'required|exists:barbers,id',
            'booking_date' => 'required|date_format:Y-m-d',
        ]);

        $slots = $this->bookingService->getAvailableSlots($data);

        return $this->success($slots);
    }

    public function cancel(Booking $booking)
    {
        $booking = $this->bookingService->cancelByCustomer($booking);

        return $this->success($booking, 'Booking cancelled successfully');
    }

}
