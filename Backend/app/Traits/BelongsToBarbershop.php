<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\Auth;

trait BelongsToBarbershop
{
    protected static function booted()
    {
        if (app()->runningInConsole()) {
            return;
        }

        static::addGlobalScope('tenant', function (Builder $query) {
            if (Auth::check() && Auth::user()->barbershop_id !== null) {
                $query->where('barbershop_id', Auth::user()->barbershop_id);
            }
        });

        static::creating(function ($model) {
            if (Auth::check() && empty($model->barbershop_id)) {
                $model->barbershop_id = Auth::user()->barbershop_id;
            }
        });

        static::updating(function ($model) {
            if (Auth::check() && $model->barbershop_id !== Auth::user()->barbershop_id) {
                abort(403, 'Unauthorized tenant access');
            }
        });

        static::deleting(function ($model) {
            if (Auth::check() && $model->barbershop_id !== Auth::user()->barbershop_id) {
                abort(403, 'Unauthorized tenant access');
            }
        });

    }
}
