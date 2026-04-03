<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Barbershop extends Model
{
    use SoftDeletes, HasFactory;
    
    protected $fillable = [
        'name',
        'slug',
        'address',
        'city',
        'phone',
        'status'
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

}
