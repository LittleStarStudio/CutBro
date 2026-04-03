<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class OperationalHour extends Model
{
    protected $fillable = [
        'barbershop_id',
        'day_of_week',
        'open_time',
        'close_time',
        'is_closed'
    ];

    public function barbershop()
    {
        return $this->belongsTo(Barbershop::class);
    }
}