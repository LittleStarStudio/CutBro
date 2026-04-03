<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Api\BaseController;
use App\Services\BookingService;
use Illuminate\Http\Request;

class ListBookingController extends BaseController
{
    protected $bookingService;

    public function __construct(BookingService $bookingService)
    {
        $this->bookingService = $bookingService;
    }

    public function index(Request $request)
    {
        $filters = [
            'date' => $request->query('date'),
            'barber_id' => $request->query('barber_id'),
            'status' => $request->query('status'),
        ];

        $bookings = $this->bookingService->getOwnerBookings($filters);

        return $this->success($bookings);
    }
}