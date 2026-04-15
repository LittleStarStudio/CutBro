<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BarbershopPhoto extends Model
{
    protected $fillable = ['barbershop_id', 'photo_url', 'order'];

    public function barbershop()
    {
        return $this->belongsTo(Barbershop::class);
    }
}
