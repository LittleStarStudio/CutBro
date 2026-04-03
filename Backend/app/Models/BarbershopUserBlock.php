<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class BarbershopUserBlock extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'barbershop_id',
        'user_id',
        'status',
        'reason'
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}