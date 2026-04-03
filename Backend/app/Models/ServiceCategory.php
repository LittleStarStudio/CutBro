<?php

namespace App\Models;

use App\Traits\BelongsToBarbershop;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class ServiceCategory extends Model
{
    use BelongsToBarbershop, SoftDeletes;

    protected $fillable = [
        'name',
        'is_active'
    ];

    public function services()
    {
        return $this->hasMany(Service::class, 'category_id');
    }

}
