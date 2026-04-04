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

        $query = Booking::with(['customer', 'barber', 'service'])
            ->where('barbershop_id', $barbershopId)
            ->whereIn('status', ['paid', 'done']);

        // Optional filters
        if ($request->filled('barber_id')) {
            $query->where('barber_id', $request->barber_id);
        }
        if ($request->filled('date_from')) {
            $query->whereDate('booking_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('booking_date', '<=', $request->date_to);
        }

        $transactions = $query->orderBy('booking_date', 'desc')
            ->get()
            ->map(fn($b) => [
                'id'             => $b->id,
                'invoice_number' => 'INV-' . str_pad($b->id, 5, '0', STR_PAD_LEFT),
                'customer_name'  => $b->customer?->name,
                'service_name'   => $b->service?->name,
                'barber_name'    => $b->barber?->name,
                'price'          => $b->total_price,
                'date'           => $b->booking_date?->format('Y-m-d'),
                'status'         => $b->status,
            ]);

        return response()->json(['success' => true, 'data' => $transactions]);
    }
}
