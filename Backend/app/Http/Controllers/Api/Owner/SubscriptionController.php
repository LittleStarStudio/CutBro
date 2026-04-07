<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Api\BaseController;
use App\Models\OwnerSubscription;
use App\Models\SubscriptionPlan;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class SubscriptionController extends BaseController
{
    // GET /owner/subscription
    public function index(Request $request)
    {
        $barbershop = $request->user()->barbershop;

        $active = OwnerSubscription::with('plan')
            ->where('barbershop_id', $barbershop->id)
            ->where('status', 'active')
            ->latest()
            ->first();

        $plans = SubscriptionPlan::orderBy('price')->get();

        return $this->success([
            'active_subscription' => $active ? [
                'id'         => $active->id,
                'plan'       => $active->plan->name,
                'plan_label' => $active->plan->display_name,
                'status'     => $active->status,
                'started_at' => $active->started_at?->toDateString(),
                'expired_at' => $active->expired_at?->toDateString(),
            ] : null,
            'plans' => $plans,
        ]);
    }

    // POST /owner/subscription/checkout
    public function checkout(Request $request)
    {
        $request->validate([
            'plan_id' => 'required|exists:subscription_plans,id',
        ]);

        $barbershop = $request->user()->barbershop;
        $plan       = SubscriptionPlan::findOrFail($request->plan_id);

        // Free plan: langsung aktifkan tanpa pembayaran
        if ($plan->price === 0) {
            OwnerSubscription::where('barbershop_id', $barbershop->id)
                ->where('status', 'active')
                ->update(['status' => 'cancelled']);

            OwnerSubscription::create([
                'barbershop_id' => $barbershop->id,
                'plan_id'       => $plan->id,
                'status'        => 'active',
                'started_at'    => now(),
                'expired_at'    => null,
            ]);

            $barbershop->update(['subscription_plan' => $plan->name]);

            return $this->success(['plan' => $plan->name], 'Switched to Free plan successfully.');
        }

        // Paid plan: buat Midtrans Snap token
        $orderId = 'SUB-' . $barbershop->id . '-' . time();

        $subscription = OwnerSubscription::create([
            'barbershop_id'       => $barbershop->id,
            'plan_id'             => $plan->id,
            'status'              => 'active', // akan di-update setelah bayar
            'started_at'          => null,
            'expired_at'          => null,
            'midtrans_order_id'   => $orderId,
        ]);

        \Midtrans\Config::$serverKey    = config('services.midtrans.server_key');
        \Midtrans\Config::$isProduction = config('services.midtrans.is_production');
        \Midtrans\Config::$isSanitized  = true;
        \Midtrans\Config::$is3ds        = true;

        $params = [
            'transaction_details' => [
                'order_id'      => $orderId,
                'gross_amount'  => $plan->price,
            ],
            'customer_details' => [
                'first_name' => $request->user()->name,
                'email'      => $request->user()->email,
            ],
            'item_details' => [[
                'id'       => $plan->name,
                'price'    => $plan->price,
                'quantity' => 1,
                'name'     => 'CutBro ' . $plan->display_name . ' Plan (1 month)',
            ]],
        ];

        $snapToken = \Midtrans\Snap::getSnapToken($params);

        $subscription->update(['midtrans_snap_token' => $snapToken]);

        return $this->success([
            'snap_token'   => $snapToken,
            'order_id'     => $orderId,
            'redirect_url' => 'https://app.sandbox.midtrans.com/snap/v2/vtweb/' . $snapToken,
        ]);
    }

    // POST /subscription/callback  (public — dipanggil Midtrans)
    public function callback(Request $request)
    {
        $serverKey = config('services.midtrans.server_key');
        $orderId   = $request->order_id;
        $status    = $request->transaction_status;
        $fraud     = $request->fraud_status;

        // Verifikasi signature Midtrans
        $signatureKey = hash('sha512',
            $orderId . $request->status_code . $request->gross_amount . $serverKey
        );

        if ($signatureKey !== $request->signature_key) {
            return response()->json(['message' => 'Invalid signature'], 403);
        }

        $subscription = OwnerSubscription::with('plan')
            ->where('midtrans_order_id', $orderId)
            ->first();

        if (! $subscription) {
            return response()->json(['message' => 'Order not found'], 404);
        }

        $success = in_array($status, ['capture', 'settlement']) && $fraud !== 'challenge';

        if ($success) {
            // Nonaktifkan subscription lama
            OwnerSubscription::where('barbershop_id', $subscription->barbershop_id)
                ->where('status', 'active')
                ->where('id', '!=', $subscription->id)
                ->update(['status' => 'cancelled']);

            // Aktifkan subscription baru
            $subscription->update([
                'status'     => 'active',
                'started_at' => now(),
                'expired_at' => now()->addMonth(),
                'paid_at'    => now(),
            ]);

            // Update kolom subscription_plan di barbershops
            $subscription->barbershop->update([
                'subscription_plan' => $subscription->plan->name,
            ]);
        } elseif (in_array($status, ['cancel', 'deny', 'expire'])) {
            $subscription->update(['status' => 'cancelled']);
        }

        return response()->json(['message' => 'OK']);
    }
}
