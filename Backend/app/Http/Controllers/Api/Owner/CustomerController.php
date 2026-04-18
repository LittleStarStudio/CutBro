<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\BarbershopUserBlock;
use App\Models\User;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $barbershopId = $request->user()->barbershop_id;

        if (!$barbershopId) {
            return response()->json(['success' => false, 'message' => 'Owner does not have a barbershop.'], 403);
        }

        // Ambil semua customer ID yang pernah booking
        $customerIds = Booking::where('barbershop_id', $barbershopId)
            ->distinct()
            ->pluck('customer_id');

        // Preload booking stats sekaligus (bukan per customer)
        $bookingStats = Booking::where('barbershop_id', $barbershopId)
            ->whereIn('status', ['paid', 'done'])
            ->selectRaw('customer_id, COUNT(*) as total_bookings, SUM(total_price) as total_spent')
            ->groupBy('customer_id')
            ->get()
            ->keyBy('customer_id');

        // Preload last visit sekaligus
        $lastVisits = Booking::where('barbershop_id', $barbershopId)
            ->selectRaw('customer_id, MAX(booking_date) as last_visit')
            ->groupBy('customer_id')
            ->get()
            ->keyBy('customer_id');

        // Preload semua block aktif sekaligus
        $blocks = BarbershopUserBlock::where('barbershop_id', $barbershopId)
            ->whereNull('deleted_at')
            ->get()
            ->keyBy('user_id');

        $customers = User::whereIn('id', $customerIds)
            ->get()
            ->map(function ($customer) use ($bookingStats, $lastVisits, $blocks) {
                $stats     = $bookingStats->get($customer->id);
                $block     = $blocks->get($customer->id);

                return [
                    'id'             => $customer->id,
                    'name'           => $customer->name,
                    'email'          => $customer->email,
                    'phone'          => $customer->phone ?? '-',
                    'total_bookings' => $stats?->total_bookings ?? 0,
                    'last_visit'     => $lastVisits->get($customer->id)?->last_visit,
                    'total_spent'    => (int) ($stats?->total_spent ?? 0),
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

        // Verifikasi customer pernah booking di barbershop ini
        $hasBooking = Booking::where('barbershop_id', $barbershopId)
            ->where('customer_id', $user->id)
            ->exists();

        if (!$hasBooking) {
            return response()->json([
                'success' => false,
                'message' => 'Customer has not booked at this barbershop.',
            ], 403);
        }

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
                    ['reason' => $request->banned_reason, 'deleted_at' => null]
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
