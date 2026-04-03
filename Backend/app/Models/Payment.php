<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Payment extends Model
{

    protected $fillable = [
        'booking_id',
        'payment_method',
        'provider',
        'amount',
        'status',
        'external_reference',
        'paid_at'
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class);
    }
    
}
