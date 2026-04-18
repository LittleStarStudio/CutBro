<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OwnerSubscription extends Model
{
    protected $fillable = [
        'barbershop_id',
        'plan_id',
        'status',
        'started_at',
        'expired_at',
        'midtrans_order_id',
        'midtrans_snap_token',
        'payment_channel',
        'paid_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'expired_at' => 'datetime',
        'paid_at'    => 'datetime',
    ];

    public function barbershop()
    {
        return $this->belongsTo(Barbershop::class);
    }

    public function plan()
    {
        return $this->belongsTo(SubscriptionPlan::class, 'plan_id');
    }

    public function refundRequest(): HasMany
    {
        return $this->hasMany(RefundRequest::class);
    }

}
