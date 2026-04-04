<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentSetting extends Model
{
    protected $fillable = [
        'barbershop_id',
        'bank_name',
        'account_number',
        'account_holder',
        'qris_image_path',
    ];

    public function barbershop()
    {
        return $this->belongsTo(Barbershop::class);
    }
}
