<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

use App\Models\Booking;

class RefundRequest extends Model
{
    protected $fillable = [
        'transaction_type',
        'owner_subscription_id',
        'payment_id',
        'booking_id',
        'barbershop_id',
        'requested_by',
        'reason',
        'refund_amount',
        'status',
        'admin_note',
        'processed_by',
        'processed_at',
    ];

    protected $casts = [
        'processed_at'  => 'datetime',
        'refund_amount' => 'decimal:2',
    ];

    public function ownerSubscription(): BelongsTo
    {
        return $this->belongsTo(OwnerSubscription::class);
    }

    public function payment(): BelongsTo
    {
        return $this->belongsTo(Payment::class);
    }

    public function barbershop(): BelongsTo
    {
        return $this->belongsTo(Barbershop::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function processor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'processed_by');
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

}
