<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BarbershopUserBlock;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $barbershopId = $request->user()->barbershop_id;

        // Get all customers who have ever booked at this barbershop
        $customers = Booking::where('barbershop_id', $barbershopId)
            ->select('customer_id')
            ->distinct()
            ->with('customer')
            ->get()
            ->pluck('customer')
            ->filter()
            ->map(function ($customer) use ($barbershopId) {
                $bookings = Booking::where('barbershop_id', $barbershopId)
                    ->where('customer_id', $customer->id)
                    ->whereIn('status', ['paid', 'done'])
                    ->get();

                $totalBookings = $bookings->count();
                $totalSpent    = $bookings->sum('total_price');
                $lastVisit     = Booking::where('barbershop_id', $barbershopId)
                    ->where('customer_id', $customer->id)
                    ->max('booking_date');

                // Check ban status for this barbershop
                $block = BarbershopUserBlock::where('barbershop_id', $barbershopId)
                    ->where('user_id', $customer->id)
                    ->whereNull('deleted_at')
                    ->first();

                return [
                    'id'             => $customer->id,
                    'name'           => $customer->name,
                    'email'          => $customer->email,
                    'phone'          => $customer->phone ?? '-',
                    'total_bookings' => $totalBookings,
                    'last_visit'     => $lastVisit,
                    'total_spent'    => (int) $totalSpent,
                    'status'         => $block ? 'banned' : 'active',
                    'banned_reason'  => $block?->reason,
                ];
            })
            ->values();

        return response()->json(['success' => true, 'data' => $customers]);
    }

    public function updateStatus(Request $request, User $user)
    {
        $barbershopId = $request->user()->barbershop_id;

        $request->validate([
            'status'        => 'required|in:active,banned',
            'banned_reason' => 'nullable|string|max:500',
        ]);

        if ($request->status === 'banned') {
            if (!$request->banned_reason) {
                return response()->json([
                    'success' => false,
                    'message' => 'Reason for ban is required.',
                ], 422);
            }

            BarbershopUserBlock::withTrashed()
                ->updateOrCreate(
                    ['barbershop_id' => $barbershopId, 'user_id' => $user->id],
                    ['status' => 'banned', 'reason' => $request->banned_reason, 'deleted_at' => null]
                );
        } else {
            // Unban: soft-delete the block record
            BarbershopUserBlock::where('barbershop_id', $barbershopId)
                ->where('user_id', $user->id)
                ->delete();
        }

        return response()->json([
            'success' => true,
            'message' => $request->status === 'banned' ? 'Customer banned successfully' : 'Customer unbanned successfully',
        ]);
    }
}
