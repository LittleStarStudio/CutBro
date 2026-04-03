<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoginLog extends Model
{
    protected $fillable = [
        'user_id',
        'email',
        'ip_address',
        'device',
        'status',
        'reason'
    ];

    // Relational tables
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
