<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;
use DateTimeInterface;

class Booking extends Model
{
    use SoftDeletes;
    
    public const STATUS_PENDING_PAYMENT = 'pending_payment';
    public const STATUS_PAID = 'paid';
    public const STATUS_DONE = 'done';
    public const STATUS_CANCELLED = 'cancelled';
    public const STATUS_EXPIRED = 'expired';
    public const STATUS_NO_SHOW = 'no_show';

    protected $fillable = [
        'barbershop_id',
        'customer_id',
        'barber_id',
        'service_id',
        'booking_date',
        'start_time',
        'end_time',
        'status',
        'total_price'
    ];

    protected $casts = [
        'booking_date' => 'date:Y-m-d',
    ];

    protected $dates = ['deleted_at'];

    protected function serializeDate(DateTimeInterface $date): string
    {
        return Carbon::instance($date)
            ->timezone('Asia/Jakarta')
            ->format('Y-m-d H:i:s');
    }

    // Relation tables
    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    public function barber()
    {
        return $this->belongsTo(Barber::class);
    }

    public function customer()
    {
        return $this->belongsTo(User::class, 'customer_id');
    }

    public function barbershop()
    {
        return $this->belongsTo(Barbershop::class);
    }

    public function payment()
    {
        return $this->hasOne(Payment::class);
    }

}