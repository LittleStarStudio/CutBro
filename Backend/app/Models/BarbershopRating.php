<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BarbershopRating extends Model
{
    protected $fillable = ['booking_id', 'barbershop_id', 'customer_id', 'rating', 'review'];

    public function booking()    { return $this->belongsTo(Booking::class); }
    public function barbershop() { return $this->belongsTo(Barbershop::class); }
    public function customer()   { return $this->belongsTo(User::class, 'customer_id'); }
}
