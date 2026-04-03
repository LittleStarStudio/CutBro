<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Shift extends Model
{
    protected $fillable = [
        'barbershop_id',
        'name',
        'start_time',
        'end_time',
        'status',
    ];

    public function barbershop()
    {
        return $this->belongsTo(Barbershop::class);
    }

    public function assignments()
    {
        return $this->hasMany(BarberShiftAssignment::class);
    }
}