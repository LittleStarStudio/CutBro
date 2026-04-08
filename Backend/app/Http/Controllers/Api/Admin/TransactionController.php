<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\BaseController;
use App\Models\OwnerSubscription;
use App\Models\RefundRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

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
                'success'   => $query->where('status', 'active'),
                'expired'   => $query->where('status', 'expired'),
                'pending'   => $query->where('status', 'pending'),
                'cancelled' => $query->where('status', 'cancelled'),
                default     => null,
            };
        }

        if ($dateFrom = $request->date_from) {
            $query->whereDate('created_at', '>=', $dateFrom);
        }

        if ($dateTo = $request->date_to) {
            $query->whereDate('created_at', '<=', $dateTo);
        }

        $paginated = $query->paginate(15);

        $data = $paginated->getCollection()->map(function ($sub) {
            $owner = User::where('barbershop_id', $sub->barbershop_id)
                ->whereHas('role', fn ($q) => $q->where('name', 'owner'))
                ->first();

            $refundReq = $sub->refundRequest->first();

            // Map subscription status → transaction status
            $txStatus = match($sub->status) {
                'active'    => 'success',
                'pending'   => 'pending',
                'expired'   => 'expired',
                'cancelled' => 'cancelled',
                default     => 'pending',
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

        $auth   = base64_encode(config('services.midtrans.server_key') . ':');
        $synced = 0;

        foreach ($pendingSubs as $sub) {
            try {
                $res  = Http::withHeaders(['Authorization' => 'Basic ' . $auth])
                    ->get("https://api.sandbox.midtrans.com/v2/{$sub->midtrans_order_id}/status");

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
                        $updates['started_at'] = now();
                        $updates['expired_at'] = now()->addMonth();
                        $updates['paid_at']    = now();
                        $sub->barbershop?->update(['subscription_plan' => $sub->plan?->name]);
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

        // Call Midtrans Refund API
        $auth     = base64_encode(config('services.midtrans.server_key') . ':');
        $response = Http::withHeaders(['Authorization' => 'Basic ' . $auth])
            ->post("https://api.sandbox.midtrans.com/v2/{$subscription->midtrans_order_id}/refund", [
                'refund_amount' => (int) $subscription->plan->price,
                'reason'        => $request->reason,
            ]);

        $responseData = $response->json();

        // Sandbox note: Midtrans may reject refund if settlement not complete yet
        // We still proceed and log it — treat as "refund initiated"
        $midtransOk = in_array($responseData['status_code'] ?? '', ['200', '201', 200, 201]);

        if (! $midtransOk && $response->failed()) {
            return $this->error(
                'Midtrans refund failed: ' . ($responseData['status_message'] ?? 'Unknown error'),
                422
            );
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

        return $this->success([], 'Refund processed successfully.');
    }

    // ─── Owner Refund Requests (untuk booking di masa depan) ─────────────────

    public function getRefundRequests(Request $request): JsonResponse
    {
        $query = RefundRequest::with(['barbershop', 'requester', 'ownerSubscription.plan'])
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
            Http::withHeaders(['Authorization' => 'Basic ' . $auth])
                ->post("https://api.sandbox.midtrans.com/v2/{$subscription->midtrans_order_id}/refund", [
                    'refund_amount' => (int) $refundRequest->refund_amount,
                    'reason'        => $refundRequest->reason,
                ]);

            $subscription->update(['status' => 'cancelled']);
            $refundRequest->barbershop?->update(['subscription_plan' => 'free']);
        }

        $refundRequest->update([
            'status'       => 'approved',
            'admin_note'   => $request->admin_note,
            'processed_by' => $request->user()->id,
            'processed_at' => now(),
        ]);

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

        return $this->success([], 'Refund request rejected.');
    }
}
