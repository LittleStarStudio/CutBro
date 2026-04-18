<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

use App\Models\BarbershopRating;

class Barbershop extends Model
{
    use SoftDeletes, HasFactory;
    
    protected $fillable = [
        'name',
        'slug',
        'description',
        'logo_url',
        'address',
        'city',
        'phone',
        'status',
        'subscription_plan',
    ];

    // Relatonal tables

    public function users()
    {
        return $this->hasMany(User::class);
    }

    public function barbers()
    {
        return $this->hasMany(Barber::class);
    }

    public function services()
    {
        return $this->hasMany(Service::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class);
    }

    public function shifts()
    {
        return $this->hasMany(Shift::class);
    }

    public function operationalHours()
    {
        return $this->hasMany(OperationalHour::class);
    }

    public function ownerSubscriptions()
    {
        return $this->hasMany(OwnerSubscription::class);
    }

    public function activeSubscription()
    {
        return $this->hasOne(OwnerSubscription::class)
            ->where('status', 'active')
            ->latest();
    }

    public function photos()
    {
        return $this->hasMany(BarbershopPhoto::class)->orderBy('order');
    }

    public function getLogoUrlAttribute($value): ?string
    {
        if (!$value) return null;
        return \Illuminate\Support\Facades\Storage::disk('public')->url($value);
    }

    public function ratings()
    {
        return $this->hasMany(BarbershopRating::class);
    }

}
