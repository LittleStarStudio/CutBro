<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    public function index(Request $request)
    {
        $barbershopId = $request->user()->barbershop_id;

        $bookings = Booking::with(['customer', 'service', 'barber.user', 'payment', 'refundRequest'])
            ->where('barbershop_id', $barbershopId)
            ->whereIn('status', ['paid', 'done', 'cancelled', 'no_show'])
            ->orderBy('booking_date', 'desc')
            ->get()
            ->map(function ($b) {
                $refund = $b->refundRequest;
                $gross  = (float) $b->total_price;

                $displayStatus = match (true) {
                    $b->status === 'cancelled' && $refund?->status === 'owner_pending'  => 'refund_requested',
                    $b->status === 'cancelled' && $refund?->status === 'owner_rejected' => 'refund_rejected',
                    $b->status === 'cancelled' && $refund?->status === 'pending'        => 'forwarded',
                    $b->status === 'cancelled' && $refund?->status === 'approved'       => 'refunded',
                    $b->status === 'cancelled' && $refund?->status === 'rejected'       => 'refund_rejected',
                    default => $b->status,
                };

                return [
                    'id'                => $b->id,
                    'order_id'          => 'ORD-' . str_pad($b->id, 7, '0', STR_PAD_LEFT),
                    'booking_date'      => $b->booking_date?->format('Y-m-d'),
                    'customer_name'     => $b->customer?->name,
                    'customer_email'    => $b->customer?->email,
                    'service_name'      => $b->service?->name,
                    'barber_name'       => $b->barber?->user?->name,
                    'payment_method'    => $b->payment?->payment_method ?? null,
                    'gross_amount'      => $gross,
                    'platform_fee'      => round($gross * 0.02, 2),
                    'net_amount'        => round($gross * 0.98, 2),
                    'display_status'    => $displayStatus,
                    'refund_request_id' => $refund?->id,
                    'refund_reason'     => $refund?->reason,
                ];
            });

        if ($request->filled('status') && $request->status !== 'all') {
            $bookings = $bookings->filter(fn($b) => $b['display_status'] === $request->status);
        }
        if ($request->filled('date_from')) {
            $bookings = $bookings->filter(fn($b) => $b['booking_date'] >= $request->date_from);
        }
        if ($request->filled('date_to')) {
            $bookings = $bookings->filter(fn($b) => $b['booking_date'] <= $request->date_to);
        }

        return response()->json(['success' => true, 'data' => $bookings->values()]);
    }
}
