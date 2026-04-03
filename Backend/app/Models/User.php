<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Laravel\Sanctum\PersonalAccessToken;
use Illuminate\Support\Str;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, SoftDeletes, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'google_id',
        'provider',
        'password',
        'barbershop_id',
        'role_id',
        'avatar_url',
        'status',
        'email_verified_at',
        'login_attempts',
        'locked_until',
        'last_login_at',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    // Create access token (short-lived)
    public function createAccessToken(string $device, array $abilities)
    {
        return $this->tokens()->create([
            'name' => $device,
            'token' => hash('sha256', Str::random(40)),
            'abilities' => $abilities,
            'expires_at' => now()->addMinutes(15), // ACCESS TOKEN
            'is_refresh' => false,
        ]);
    }

    //  Create refresh token (long-lived)
    public function createRefreshToken(string $device)
    {
        return $this->tokens()->create([
            'name' => $device . '_refresh',
            'token' => hash('sha256', Str::random(64)),
            'abilities' => ['refresh'],
            'expires_at' => now()->addDays(7), // REFRESH TOKEN
            'is_refresh' => true,
        ]);
    }

    // Relational tables
    public function role()
    {
        return $this->belongsTo(Role::class);
    }

    public function blocks()
    {
        return $this->hasMany(BarbershopUserBlock::class);
    }

    public function barber()
    {
        return $this->hasOne(Barber::class);
    }

    public function barbershop()
    {
        return $this->belongsTo(Barbershop::class);
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'customer_id');
    }
    
}
