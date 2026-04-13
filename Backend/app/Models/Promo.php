<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Promo extends Model
{
    protected $fillable = [
        'barbershop_id',
        'service_id',
        'name',
        'original_price',
        'discount_percent',
        'final_price',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function barbershop()
    {
        return $this->belongsTo(Barbershop::class);
    }

    public function service()
    {
        return $this->belongsTo(Service::class);
    }

}
