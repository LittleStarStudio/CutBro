<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Api\BaseController;
use App\Models\Booking;
use App\Services\BookingService;
use Illuminate\Http\Request;

class BookingController extends BaseController
{
    public function __construct(
        protected BookingService $bookingService
    ) {}

    public function updateStatus(Request $request, Booking $booking)
    {
        $owner = auth()->user();

        // Owner validation
        $ownerShopId = $owner->barbershop_id;
        
        if (!$ownerShopId || $booking->barbershop_id !== $ownerShopId) {
            abort(403, 'Unauthorized access to this booking');
        }

        // Tidak boleh edit booking yang sudah expired
        if ($booking->status === Booking::STATUS_EXPIRED) {
            abort(400, 'Cannot update expired booking');
        }

        // Validasi input status
        $data = $request->validate([
            'status' => 'required|in:' . implode(',', [
                Booking::STATUS_PAID,
                Booking::STATUS_DONE,
                Booking::STATUS_CANCELLED,
                Booking::STATUS_NO_SHOW,
            ])
        ]);

        // Update status
        $booking = $this->bookingService->updateStatus($booking, $data['status']);

        return $this->success($booking);
    }

}