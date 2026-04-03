<?php

namespace App\Http\Controllers\Api\Customer;

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
        $filter = $request->query('filter');

        $bookings = $this->bookingService->getCustomerBookings($filter);

        return $this->success($bookings);
        
    }
}
