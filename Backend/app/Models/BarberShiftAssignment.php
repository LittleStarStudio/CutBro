<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class BarberShiftAssignment extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'barber_id',
        'shift_id',
        'day_of_week',
        'status',
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