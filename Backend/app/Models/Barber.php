<?php

namespace App\Models;

use App\Traits\BelongsToBarbershop;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Barber extends Model
{
    use BelongsToBarbershop, SoftDeletes;

    protected $fillable = [
        'user_id',
        'bio',
        'photo_url',
        'status',
        'created_by_owner_id'
    ];

    // Relational tables
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function owner()
    {
        return $this->belongsTo(User::class, 'created_by_owner_id');
    }

    public function shiftAssignments()
    {
        return $this->hasMany(BarberShiftAssignment::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

}