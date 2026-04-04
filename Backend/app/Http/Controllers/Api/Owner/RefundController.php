<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\Request;

class RefundController extends Controller
{
    public function index(Request $request)
    {
        $barbershopId = $request->user()->barbershop_id;

        // Refund candidates: cancelled bookings that were previously paid
        $refunds = Booking::with(['customer', 'service'])
            ->where('barbershop_id', $barbershopId)
            ->whereIn('status', ['cancelled', 'paid', 'done', 'expired'])
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(fn($b) => [
                'id'           => (string) $b->id,
                'date_time'    => $b->updated_at,
                'order_id'     => 'ORD-' . str_pad($b->id, 7, '0', STR_PAD_LEFT),
                'payment'      => 'QRIS',   // payment method akan ada setelah Payment integration
                'status'       => $b->status === 'cancelled' ? 'refunded' : $b->status,
                'amount'       => $b->total_price,
                'email'        => $b->customer?->email,
            ]);

        return response()->json(['success' => true, 'data' => $refunds]);
    }

    public function updateStatus(Request $request, Booking $booking)
    {
        $barbershopId = $request->user()->barbershop_id;

        if ($booking->barbershop_id !== $barbershopId) {
            return response()->json(['success' => false, 'message' => 'Not found'], 404);
        }

        $request->validate([
            'status' => 'required|in:refunded,failed',
        ]);

        // For now, map refund status to booking status
        if ($request->status === 'refunded') {
            $booking->update(['status' => 'cancelled']);
        }

        return response()->json(['success' => true, 'message' => 'Refund status updated']);
    }
}
