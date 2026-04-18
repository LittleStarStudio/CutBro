<?php

namespace App\Http\Controllers\Api\Customer;

use App\Http\Controllers\Api\BaseController;
use App\Services\BookingService;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\BarbershopRating;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BookingController extends BaseController
{
    public function __construct(protected BookingService $bookingService) {}

    public function store(Request $request)
    {
        $data = $request->validate([
            'service_id'   => 'required|exists:services,id',
            'barber_id'    => 'required|exists:barbers,id',
            'booking_date' => 'required|date_format:Y-m-d',
            'start_time'   => 'required|date_format:H:i',
        ]);

        return DB::transaction(function () use ($request, $data) {
            $booking = $this->bookingService->create($data);
            $booking->load(['service', 'barbershop']);

            $orderId = 'BKG-' . $booking->id . '-' . time();

            \Midtrans\Config::$serverKey    = config('services.midtrans.server_key');
            \Midtrans\Config::$isProduction = config('services.midtrans.is_production');
            \Midtrans\Config::$isSanitized  = true;
            \Midtrans\Config::$is3ds        = true;

            try {
                $snapToken = \Midtrans\Snap::getSnapToken([
                    'transaction_details' => [
                        'order_id'     => $orderId,
                        'gross_amount' => (int) $booking->total_price,
                    ],
                    'customer_details' => [
                        'first_name' => $request->user()->name,
                        'email'      => $request->user()->email,
                    ],
                    'item_details' => [[
                        'id'       => 'SVC-' . $booking->service_id,
                        'price'    => (int) $booking->total_price,
                        'quantity' => 1,
                        'name'     => $booking->service->name . ' at ' . $booking->barbershop->name,
                    ]],
                ]);
            } catch (\Exception $e) {
                abort(500, 'Payment gateway error. Please try again.');
            }

            Payment::create([
                'booking_id'         => $booking->id,
                'provider'           => 'midtrans',
                'amount'             => $booking->total_price,
                'status'             => 'pending',
                'external_reference' => $orderId,
                'snap_token'         => $snapToken,
            ]);

            return $this->success([
                'booking'    => $booking,
                'snap_token' => $snapToken,
                'order_id'   => $orderId,
            ]);
        });
    }

    public function availableSlots(Request $request)
    {
        $data = $request->validate([
            'service_id'   => 'required|exists:services,id',
            'barber_id'    => 'required|exists:barbers,id',
            'booking_date' => 'required|date_format:Y-m-d',
        ]);

        return $this->success($this->bookingService->getAvailableSlots($data));
    }

    public function cancel(Booking $booking)
    {
        return $this->success(
            $this->bookingService->cancelByCustomer($booking),
            'Booking cancelled successfully'
        );
    }

    // Dipanggil frontend setelah Midtrans onSuccess
    public function activate(Request $request, Booking $booking)
    {
        if ($booking->customer_id !== $request->user()->id) {
            return $this->error('Unauthorized', 403);
        }

        if ($booking->status !== 'pending_payment') {
            return $this->success($booking, 'Already processed.');
        }

        $booking->update(['status' => 'paid']);
        $booking->payment?->update(['status' => 'paid', 'paid_at' => now()]);

        return $this->success($booking, 'Booking confirmed.');
    }

    // Dipanggil Midtrans webhook (public route)
    public function callback(Request $request)
    {
        $serverKey    = config('services.midtrans.server_key');
        $orderId      = $request->order_id;
        $status       = $request->transaction_status;
        $fraud        = $request->fraud_status;
        $signatureKey = hash('sha512',
            $orderId . $request->status_code . $request->gross_amount . $serverKey
        );

        if ($signatureKey !== $request->signature_key) {
            return response()->json(['message' => 'Invalid signature'], 403);
        }

        $payment = Payment::with('booking')->where('external_reference', $orderId)->first();

        if (! $payment) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $success = in_array($status, ['capture', 'settlement']) && $fraud !== 'challenge';

        if ($success) {
            $payment->update([
                'status'         => 'paid',
                'payment_method' => $request->payment_type,
                'paid_at'        => now(),
            ]);
            $payment->booking?->update(['status' => 'paid']);
        } elseif (in_array($status, ['cancel', 'deny', 'expire'])) {
            $payment->update(['status' => 'failed']);
            $payment->booking?->update(['status' => 'cancelled']);
        }

        return response()->json(['message' => 'OK']);
    }

    public function rate(Request $request, Booking $booking)
    {
        if ($booking->customer_id !== $request->user()->id) {
            return $this->error('Unauthorized', 403);
        }

        if ($booking->status !== 'done') {
            return $this->error('Can only rate completed bookings', 400);
        }

        if ($booking->rating()->exists()) {
            return $this->error('Already rated', 400);
        }

        $data = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'review' => 'nullable|string|max:500',
        ]);

        $rating = BarbershopRating::create([
            'booking_id'    => $booking->id,
            'barbershop_id' => $booking->barbershop_id,
            'customer_id'   => $request->user()->id,
            'rating'        => $data['rating'],
            'review'        => $data['review'] ?? null,
        ]);

        // Kirim notifikasi ke owner barbershop
        $owner = User::where('barbershop_id', $booking->barbershop_id)
            ->whereHas('role', fn($q) => $q->where('name', 'owner'))
            ->first();

        if ($owner) {
            Notification::create([
                'user_id' => $owner->id,
                'type'    => 'new_rating',
                'title'   => 'New Customer Rating',
                'body'    => "{$request->user()->name} gave your barbershop {$data['rating']} star(s)."
                    . ($data['review'] ? " Review: \"{$data['review']}\"" : ""),
                'data'    => ['booking_id' => $booking->id, 'rating' => $data['rating']],
            ]);
        }

        return $this->success($rating, 'Rating submitted successfully.');

    }

}
