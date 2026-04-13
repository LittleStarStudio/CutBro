<?php

namespace App\Models;

use App\Traits\BelongsToBarbershop;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

use App\Models\Promo;

class Service extends Model
{
    use BelongsToBarbershop, SoftDeletes;

    protected $fillable = [
        'category_id',
        'name',
        'description',
        'price',
        'duration_minutes',
        'is_active'
    ];

    // Relational tables
    public function category()
    {
        return $this->belongsTo(ServiceCategory::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function promos()
    {
        return $this->hasMany(Promo::class);
    }

}
