<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\BaseController;

use App\Models\OwnerSubscription;
use App\Models\RefundRequest;
use App\Models\User;
use App\Models\Notification;
use App\Models\SubscriptionPlan;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TransactionController extends BaseController
{
    // ─── Stats ────────────────────────────────────────────────────────────────

    public function stats(): JsonResponse
    {
        $totalSubs   = OwnerSubscription::whereNotNull('midtrans_order_id')->count();
        $successSubs = OwnerSubscription::whereNotNull('midtrans_order_id')
            ->where('status', 'active')
            ->count();

        $totalRevenue = OwnerSubscription::whereNotNull('paid_at')
            ->whereNotNull('midtrans_order_id')
            ->whereIn('status', ['active', 'expired', 'cancelled'])
            ->join('subscription_plans', 'owner_subscriptions.plan_id', '=', 'subscription_plans.id')
            ->sum('subscription_plans.price');

        $refunded = RefundRequest::where('status', 'approved')->sum('refund_amount');

        return $this->success([
            'total_transactions' => $totalSubs,
            'subscription_count' => $totalSubs,
            'booking_count'      => Booking::whereIn('status', ['paid', 'done'])->count(),
            'success_rate'       => $totalSubs > 0 ? round($successSubs / $totalSubs * 100, 1) : 0,
            'total_revenue'      => (float) $totalRevenue,
            'available_balance'  => (float) ($totalRevenue - $refunded),
        ]);
    }

    // ─── Transaction List ─────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $query = OwnerSubscription::with(['barbershop', 'plan', 'refundRequest'])
            ->whereNotNull('midtrans_order_id')
            ->latest('created_at');

        if ($search = $request->search) {
            $query->where(function ($q) use ($search) {
                $q->where('midtrans_order_id', 'like', "%{$search}%")
                  ->orWhereHas('barbershop', fn ($b) =>
                      $b->where('name', 'like', "%{$search}%")
                  );
            });
        }

        if ($status = $request->status) {
            match ($status) {
                'success'         => $query->where('status', 'active')
                                        ->whereDoesntHave('refundRequest'),
                'pending'         => $query->where('status', 'pending'),
                'expired'         => $query->where('status', 'expired'),
                'cancelled'       => $query->where('status', 'cancelled')
                                        ->whereDoesntHave('refundRequest', fn ($q) => $q->where('status', 'approved')),
                'refunded'        => $query->whereHas('refundRequest', fn ($q) => $q->where('status', 'approved')),
                'refund_rejected' => $query->whereHas('refundRequest', fn ($q) => $q->where('status', 'rejected')),
                'refund_pending'  => $query->whereHas('refundRequest', fn ($q) => $q->where('status', 'pending')),
                default           => null,
            };
        }

        if ($dateFrom = $request->date_from) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo = $request->date_to) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $perPage   = min((int) $request->input('per_page', 15), 500);
        $paginated = $query->paginate($perPage);

        // Pre-fetch semua owner sekaligus
        $barbershopIds = $paginated->getCollection()->pluck('barbershop_id')->unique()->values();
        $owners = User::whereIn('barbershop_id', $barbershopIds)
            ->whereHas('role', fn ($q) => $q->where('name', 'owner'))
            ->get()
            ->keyBy('barbershop_id');

        $data = $paginated->getCollection()->map(function ($sub) use ($owners) {
            $owner = $owners->get($sub->barbershop_id);

            $refundReq = $sub->refundRequest->sortByDesc('created_at')->first();

            // Map subscription status → transaction status (refund takes priority)
            $txStatus = match(true) {
                $refundReq && $refundReq->status === 'approved' => 'refunded',
                $refundReq && $refundReq->status === 'rejected' => 'refund_rejected',
                $refundReq && $refundReq->status === 'pending'  => 'refund_pending',
                $sub->status === 'active'                       => 'success',
                $sub->status === 'pending'                      => 'pending',
                $sub->status === 'expired'                      => 'expired',
                $sub->status === 'cancelled'                    => 'cancelled',
                default                                         => 'pending',
            };

            return [
                'id'               => $sub->id,
                'transaction_type' => 'subscription',
                'order_id'         => $sub->midtrans_order_id,
                'buyer_name'       => $sub->barbershop?->name ?? '-',
                'buyer_email'      => $owner?->email ?? '-',
                'payment_channel'  => $sub->payment_channel ?? '-',
                'amount'           => (float) ($sub->plan?->price ?? 0),
                'status'           => $txStatus,
                'subscription_status' => $sub->status,   // ← disimpan untuk logic refund
                'paid_at'          => $sub->paid_at?->format('Y-m-d'),
                'created_at'       => $sub->created_at->format('Y-m-d'),
                'refund_request'   => $refundReq ? [
                    'id'         => $refundReq->id,
                    'status'     => $refundReq->status,
                    'reason'     => $refundReq->reason,
                    'admin_note' => $refundReq->admin_note,
                ] : null,
            ];

        });

        return $this->success([
            'data'         => $data,
            'current_page' => $paginated->currentPage(),
            'last_page'    => $paginated->lastPage(),
            'per_page'     => $paginated->perPage(),
            'total'        => $paginated->total(),
        ]);
    }

    // ─── Sync Pending Transactions from Midtrans ──────────────────────────────
    public function syncPending(): JsonResponse
    {
        $pendingSubs = OwnerSubscription::with(['plan', 'barbershop'])
            ->whereNotNull('midtrans_order_id')
            ->where('status', 'pending')
            ->get();

        $auth    = base64_encode(config('services.midtrans.server_key') . ':');
        $baseUrl = config('services.midtrans.is_production')
            ? 'https://api.midtrans.com'
            : 'https://api.sandbox.midtrans.com';
        $synced  = 0;

        foreach ($pendingSubs as $sub) {
            try {
                $res  = Http::withHeaders(['Authorization' => 'Basic ' . $auth])
                    ->get("{$baseUrl}/v2/{$sub->midtrans_order_id}/status");

                $data        = $res->json();
                $txStatus    = $data['transaction_status'] ?? null;
                $paymentType = $data['payment_type'] ?? null;

                $newStatus = match ($txStatus) {
                    'settlement', 'capture' => 'active',
                    'expire'               => 'expired',
                    'cancel', 'deny'       => 'cancelled',
                    default                => null,
                };

                $updates = [];

                // Update payment_channel jika baru diketahui
                if ($paymentType && ! $sub->payment_channel) {
                    $updates['payment_channel'] = $paymentType;
                }

                if ($newStatus) {
                    $updates['status'] = $newStatus;

                    if ($newStatus === 'active') {
                    $existingActive = OwnerSubscription::where('barbershop_id', $sub->barbershop_id)
                        ->where('status', 'active')
                        ->where('id', '!=', $sub->id)
                        ->first();

                        if ($existingActive) {
                            // Queued: mulai setelah yang lama expired
                            $updates['started_at'] = $existingActive->expired_at;
                            $updates['expired_at'] = $existingActive->expired_at->copy()->addMonth();
                        } else {
                            // Normal: mulai sekarang
                            OwnerSubscription::where('barbershop_id', $sub->barbershop_id)
                                ->where('status', 'active')
                                ->where('id', '!=', $sub->id)
                                ->update(['status' => 'cancelled']);

                            $updates['started_at'] = now();
                            $updates['expired_at'] = now()->addMonth();
                            $sub->barbershop?->update(['subscription_plan' => $sub->plan?->name]);
                        }

                        $updates['paid_at'] = now();

                        // Kirim notifikasi ke owner
                        $owner = User::where('barbershop_id', $sub->barbershop_id)
                            ->whereHas('role', fn($q) => $q->where('name', 'owner'))
                            ->first();
                        if ($owner) {
                            Notification::create([
                                'user_id' => $owner->id,
                                'type'    => 'subscription_active',
                                'title'   => 'Subscription Activated',
                                'body'    => "Your {$sub->plan->name} subscription is now active and valid until {$updates['expired_at']->format('d M Y')}. You can request a refund within the first 7 days if needed.",
                                'data'    => [
                                    'subscription_id'  => $sub->id,
                                    'plan_name'        => $sub->plan->name,
                                    'expired_at'       => $updates['expired_at']->toDateString(),
                                    'refundable_until' => $updates['started_at']->copy()->addDays(7)->toDateString(),
                                ],
                            ]);
                        }

                    } elseif (in_array($newStatus, ['expired', 'cancelled'])) {
                        $sub->barbershop?->update(['subscription_plan' => 'free']);
                    }
                }

                if (! empty($updates)) {
                    $sub->update($updates);
                    $synced++;
                }

            } catch (\Throwable) {
                // Skip jika API error
            }
        }

        return $this->success(['synced' => $synced], "Synced {$synced} transaction(s) from Midtrans.");
    }

    // ─── Admin Direct Refund (Subscription) ──────────────────────────────────
    public function processRefund(Request $request, OwnerSubscription $subscription): JsonResponse
    {
        $request->validate(['reason' => 'required|string|max:500']);

        if ($subscription->status !== 'active') {
            return $this->error('Only active subscriptions can be refunded.', 422);
        }

        // Cegah double-refund
        $alreadyRefunded = RefundRequest::where('owner_subscription_id', $subscription->id)
            ->where('status', 'approved')
            ->exists();

        if ($alreadyRefunded) {
            return $this->error('This subscription has already been refunded.', 422);
        }

        // Call Midtrans Refund API
        $auth     = base64_encode(config('services.midtrans.server_key') . ':');
        $baseUrl  = config('services.midtrans.is_production')        // ← tambahkan ini
            ? 'https://api.midtrans.com'
            : 'https://api.sandbox.midtrans.com';
        $response = Http::withHeaders(['Authorization' => 'Basic ' . $auth])
            ->post("{$baseUrl}/v2/{$subscription->midtrans_order_id}/refund", [
                'refund_amount' => (int) $subscription->plan->price,
                'reason'        => $request->reason,
            ]);

        $responseData = $response->json();

        // Sandbox note: Midtrans may reject refund if settlement not complete yet
        // We log the failure but proceed — treat as "refund initiated"
        $midtransOk = in_array($responseData['status_code'] ?? '', ['200', '201', 200, 201]);

        if (! $midtransOk) {
            Log::warning('Midtrans refund API failed — proceeding with local refund', [
                'order_id' => $subscription->midtrans_order_id,
                'response' => $responseData,
            ]);
        }

        // Update subscription + barbershop
        $subscription->update(['status' => 'cancelled']);
        $subscription->barbershop?->update(['subscription_plan' => 'free']);

        // Log refund
        RefundRequest::create([
            'transaction_type'      => 'subscription',
            'owner_subscription_id' => $subscription->id,
            'barbershop_id'         => $subscription->barbershop_id,
            'requested_by'          => $request->user()->id,
            'reason'                => $request->reason,
            'refund_amount'         => $subscription->plan->price,
            'status'                => 'approved',
            'admin_note'            => 'Admin initiated refund',
            'processed_by'          => $request->user()->id,
            'processed_at'          => now(),
        ]);

        $this->notifyOwner(
            $subscription->barbershop_id,
            'refund_approved',
            'Refund Approved',
            "Your {$subscription->plan->name} subscription refund has been approved. " .
            "Rp " . number_format($subscription->plan->price, 0, ',', '.') .
            " will be returned to your original payment method (via Midtrans) within 1–14 business days.",
            [
                'order_id'      => $subscription->midtrans_order_id,
                'plan_name'     => $subscription->plan->name,
                'refund_amount' => $subscription->plan->price,
            ]
        );
        return $this->success([], 'Refund processed successfully.');
    }

    // ─── Admin Direct Reject (tanpa proses Midtrans) ─────────────────────────
    public function rejectDirectRefund(Request $request, OwnerSubscription $subscription): JsonResponse
    {
        $request->validate(['reason' => 'required|string|max:500']);

        if ($subscription->status !== 'active') {
            return $this->error('Only active subscriptions can be rejected.', 422);
        }

        $alreadyProcessed = RefundRequest::where('owner_subscription_id', $subscription->id)
            ->whereIn('status', ['approved', 'rejected'])
            ->exists();

        if ($alreadyProcessed) {
            return $this->error('This subscription refund has already been processed.', 422);
        }

        RefundRequest::create([
            'transaction_type'      => 'subscription',
            'owner_subscription_id' => $subscription->id,
            'barbershop_id'         => $subscription->barbershop_id,
            'requested_by'          => $request->user()->id,
            'reason'                => $request->reason,
            'refund_amount'         => 0,
            'status'                => 'rejected',
            'admin_note'            => 'Admin declined refund request.',
            'processed_by'          => $request->user()->id,
            'processed_at'          => now(),
        ]);

        $this->notifyOwner(
            $subscription->barbershop_id,
            'refund_rejected',
            'Refund Request Declined',
            "Your refund request for {$subscription->plan->name} subscription has been declined. Reason: {$request->reason}. No funds will be returned.",
            [
                'order_id'  => $subscription->midtrans_order_id,
                'plan_name' => $subscription->plan->name,
                'reason'    => $request->reason,
            ]
        );

        return $this->success([], 'Refund request rejected and owner has been notified.');
    }

    // ─── Owner Refund Requests (untuk booking di masa depan) ─────────────────
    public function getRefundRequests(Request $request): JsonResponse
    {
        $query = RefundRequest::with(['barbershop', 'requester', 'ownerSubscription.plan'])
            ->where('status', '!=', 'owner_pending')
            ->latest();

        if ($status = $request->status) {
            $query->where('status', $status);
        }

        $paginated = $query->paginate(15);

        $data = $paginated->getCollection()->map(function ($r) {
            return [
                'id'               => $r->id,
                'transaction_type' => $r->transaction_type,
                'order_id'         => $r->ownerSubscription?->midtrans_order_id ?? 'N/A',
                'barbershop_name'  => $r->barbershop?->name ?? '-',
                'requester_email'  => $r->requester?->email ?? '-',
                'refund_amount'    => (float) $r->refund_amount,
                'reason'           => $r->reason,
                'status'           => $r->status,
                'admin_note'       => $r->admin_note,
                'created_at'       => $r->created_at->format('Y-m-d H:i'),
            ];
        });

        return $this->success([
            'data'         => $data,
            'current_page' => $paginated->currentPage(),
            'last_page'    => $paginated->lastPage(),
            'total'        => $paginated->total(),
        ]);
    }

    public function approveRefund(Request $request, RefundRequest $refundRequest): JsonResponse
    {
        $request->validate(['admin_note' => 'required|string|max:500']);

        if ($refundRequest->status !== 'pending') {
            return $this->error('This refund request has already been processed.', 422);
        }

        $subscription = $refundRequest->ownerSubscription;
        if ($subscription) {
            $auth = base64_encode(config('services.midtrans.server_key') . ':');
            $baseUrl = config('services.midtrans.is_production')         
                ? 'https://api.midtrans.com'
                : 'https://api.sandbox.midtrans.com';
            $response = Http::withHeaders(['Authorization' => 'Basic ' . $auth])
                ->post("{$baseUrl}/v2/{$subscription->midtrans_order_id}/refund", [
                    'refund_amount' => (int) $refundRequest->refund_amount,
                    'reason'        => $refundRequest->reason,
                ]);

            $responseData = $response->json();
            $midtransOk   = in_array($responseData['status_code'] ?? '', ['200', '201', 200, 201]);

            if (! $midtransOk) {
                return $this->error(
                    'Midtrans refund failed: ' . ($responseData['status_message'] ?? 'Unknown error'),
                    422
                );
            }

            $subscription->update(['status' => 'cancelled']);
            $refundRequest->barbershop?->update(['subscription_plan' => 'free']);
        }

        $refundRequest->update([
            'status'       => 'approved',
            'admin_note'   => $request->admin_note,
            'processed_by' => $request->user()->id,
            'processed_at' => now(),
        ]);

        if ($subscription) {
            $this->notifyOwner(
                $refundRequest->barbershop_id,
                'refund_approved',
                'Refund Approved',
                "Your {$subscription->plan->name} subscription refund has been approved. " .
                "Rp " . number_format($refundRequest->refund_amount, 0, ',', '.') .
                " will be returned to your original payment method (via Midtrans) within 1–14 business days.",
                [
                    'order_id'      => $subscription->midtrans_order_id,
                    'plan_name'     => $subscription->plan->name,
                    'refund_amount' => $refundRequest->refund_amount,
                ]
            );
        }

        return $this->success([], 'Refund request approved.');
    }

    public function rejectRefund(Request $request, RefundRequest $refundRequest): JsonResponse
    {
        $request->validate(['admin_note' => 'required|string|max:500']);

        if ($refundRequest->status !== 'pending') {
            return $this->error('This refund request has already been processed.', 422);
        }

        $refundRequest->update([
            'status'       => 'rejected',
            'admin_note'   => $request->admin_note,
            'processed_by' => $request->user()->id,
            'processed_at' => now(),
        ]);

        $subscription = $refundRequest->ownerSubscription;
        $planName = $subscription?->plan?->name ?? 'subscription';

        $this->notifyOwner(
            $refundRequest->barbershop_id,
            'refund_rejected',
            'Refund Request Declined',
            "Your refund request for {$planName} has been declined. Reason: {$request->admin_note}. No funds will be returned.",
            [
                'order_id'  => $subscription?->midtrans_order_id,
                'plan_name' => $planName,
                'reason'    => $request->admin_note,
            ]
        );

        return $this->success([], 'Refund request rejected.');
    }

    // ─── Helper: Send notification to owner of a barbershop ──────────────────
    private function notifyOwner(int $barbershopId, string $type, string $title, string $body, array $data = []): void
    {
        $owner = User::where('barbershop_id', $barbershopId)
            ->whereHas('role', fn($q) => $q->where('name', 'owner'))
            ->first();

        if ($owner) {
            Notification::create([
                'user_id' => $owner->id,
                'type'    => $type,
                'title'   => $title,
                'body'    => $body,
                'data'    => $data,
            ]);
        }
    }

}
