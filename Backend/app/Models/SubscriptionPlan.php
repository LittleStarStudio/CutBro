<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubscriptionPlan extends Model
{
    protected $fillable = [
        'name',
        'display_name',
        'price',
        'description',
        'max_barbers',
    ];

    protected $casts = [
        'price'       => 'integer',
        'max_barbers' => 'integer',
    ];

    public function ownerSubscriptions()
    {
        return $this->hasMany(OwnerSubscription::class, 'plan_id');
    }
}
