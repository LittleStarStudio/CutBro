<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BarberShiftAssignment extends Model
{
    protected $fillable = [
        'barber_id',
        'shift_id',
        'day_of_week',
    ];

    public function barber()
    {
        return $this->belongsTo(Barber::class);
    }

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }
}