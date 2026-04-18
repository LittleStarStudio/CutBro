<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Api\BaseController;

use App\Models\OwnerSubscription;
use App\Models\SubscriptionPlan;
use App\Models\Notification;
use App\Models\User;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
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

        // Cegah checkout ulang plan yang sama jika sudah aktif
        if ($plan->price > 0) {
            $currentActive = OwnerSubscription::where('barbershop_id', $barbershop->id)
                ->where('status', 'active')
                ->where('plan_id', $plan->id)
                ->exists();

            if ($currentActive) {
                return $this->error('You already have an active subscription for this plan.', 422);
            }
        }

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

        // Hapus pending subscription lama sebelum buat yang baru
        OwnerSubscription::where('barbershop_id', $barbershop->id)
            ->where('status', 'pending')
            ->update(['status' => 'cancelled']);

        $subscription = OwnerSubscription::create([
            'barbershop_id'       => $barbershop->id,
            'plan_id'             => $plan->id,
            'status'              => 'pending',
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
                'status'          => 'active',
                'started_at'      => now(),
                'expired_at'      => now()->addMonth(),
                'paid_at'         => now(),
                'payment_channel' => $request->payment_type,
            ]);

            // Update kolom subscription_plan di barbershops
            $subscription->barbershop->update([
                'subscription_plan' => $subscription->plan->name,
            ]);
            
        } elseif (in_array($status, ['cancel', 'deny'])) {
            $subscription->update(['status' => 'cancelled']);
        } elseif ($status === 'expire') {
            $subscription->update(['status' => 'expired']);
        }

        return response()->json(['message' => 'OK']);
    }

    // POST /owner/subscription/activate  (dipanggil frontend setelah onSuccess)
    public function activate(Request $request)
    {
        $request->validate([
            'order_id' => 'required|string',
        ]);

        $barbershop   = $request->user()->barbershop;
        $subscription = OwnerSubscription::with('plan')
            ->where('midtrans_order_id', $request->order_id)
            ->where('barbershop_id', $barbershop->id)
            ->where('status', 'pending')
            ->first();

        if (! $subscription) {
            return $this->error('Subscription not found or already activated.', 404);
        }

        $existingActive = OwnerSubscription::where('barbershop_id', $barbershop->id)
            ->where('status', 'active')
            ->where('id', '!=', $subscription->id)
            ->first();

        if ($existingActive) {
            // Queued: mulai setelah yang lama expired
            $startedAt  = $existingActive->expired_at;
            $expiredAt  = $existingActive->expired_at->copy()->addMonth();
        } else {
            // Normal: mulai sekarang
            $startedAt = now();
            $expiredAt = now()->addMonth();
            $barbershop->update(['subscription_plan' => $subscription->plan->name]);
        }

        // Get payment channel from Midtrans
        $paymentChannel = null;
        try {
            $auth = base64_encode(config('services.midtrans.server_key') . ':');
            $statusRes = \Illuminate\Support\Facades\Http::withHeaders([
                'Authorization' => 'Basic ' . $auth,
            ])->get("https://api.sandbox.midtrans.com/v2/{$subscription->midtrans_order_id}/status");

            $paymentChannel = $statusRes->json('payment_type') ?? null;
        } catch (\Throwable) {
            // Tidak fatal
        }

        $subscription->update([
            'status'          => 'active',
            'started_at'      => $startedAt,
            'expired_at'      => $expiredAt,
            'paid_at'         => now(),
            'payment_channel' => $paymentChannel,
        ]);

        $subscription->refresh();

        // Kirim notifikasi ke owner
        Notification::create([
            'user_id' => $request->user()->id,
            'type'    => 'subscription_active',
            'title'   => 'Subscription Activated',
            'body'    => "Your {$subscription->plan->name} subscription is now active and valid until {$subscription->expired_at->format('d M Y')}. You can request a refund within the first 7 days if needed.",
            'data'    => [
                'subscription_id'  => $subscription->id,
                'plan_name'        => $subscription->plan->name,
                'expired_at'       => $subscription->expired_at->toDateString(),
                'refundable_until' => $subscription->started_at->copy()->addDays(7)->toDateString(),
            ],
        ]);

        return $this->success(['plan' => $subscription->plan->name], 'Subscription activated successfully.');
    }

    // ─── Owner Request Refund ─────────────────────────────────────────────────
    public function requestRefund(Request $request): JsonResponse
    {
        $request->validate(['reason' => 'required|string|max:500']);

        $barbershopId = $request->user()->barbershop_id;

        $subscription = OwnerSubscription::where('barbershop_id', $barbershopId)
            ->where('status', 'active')
            ->whereNotNull('paid_at')
            ->latest('paid_at')
            ->first();

        if (! $subscription) {
            return $this->error('No active subscription found.', 404);
        }

        // Cek batas 7 hari pertama
        if ($subscription->started_at->diffInDays(now()) > 7) {
            return $this->error('Refund can only be requested within the first 7 days of your subscription.', 422);
        }

        // Cek tidak ada pending/approved request
        $alreadyExists = \App\Models\RefundRequest::where('owner_subscription_id', $subscription->id)
            ->whereIn('status', ['pending', 'approved'])
            ->exists();

        if ($alreadyExists) {
            return $this->error('A refund request for this subscription is already pending or has been approved.', 422);
        }

        \App\Models\RefundRequest::create([
            'transaction_type'      => 'subscription',
            'owner_subscription_id' => $subscription->id,
            'barbershop_id'         => $barbershopId,
            'requested_by'          => $request->user()->id,
            'reason'                => $request->reason,
            'refund_amount'         => $subscription->plan->price,
            'status'                => 'pending',
        ]);

        // Kirim notifikasi ke semua super_admin
        $admins = \App\Models\User::whereHas('role', fn($q) => $q->where('name', 'super_admin'))->get();
        foreach ($admins as $admin) {
            \App\Models\Notification::create([
                'user_id' => $admin->id,
                'type'    => 'refund_request_received',
                'title'   => 'New Refund Request',
                'body'    => "Owner of {$subscription->barbershop->name} has requested a refund for their {$subscription->plan->name} subscription. Reason: {$request->reason}.",
                'data'    => [
                    'subscription_id' => $subscription->id,
                    'order_id'        => $subscription->midtrans_order_id,
                    'plan_name'       => $subscription->plan->name,
                    'refund_amount'   => $subscription->plan->price,
                    'barbershop_name' => $subscription->barbershop->name,
                ],
            ]);
        }

        return $this->success([], 'Refund request submitted successfully. Admin will review your request.');
    }

}
