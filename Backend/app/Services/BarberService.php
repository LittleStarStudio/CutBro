<?php

namespace App\Services;

use App\Models\Barber;
use App\Models\User;
use App\Models\Role;
use Illuminate\Support\Facades\Hash;

class BarberService
{
    public function getAll()
    {
        return Barber::with('user')->latest()->get();
    }

    public function create(array $data, $owner)
    {
        // ambil role barber
        $role = Role::where('name', 'barber')->firstOrFail();

        // buat user baru
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role_id' => $role->id,
            'barbershop_id' => $owner->barbershop_id,
            'email_verified_at' => now(),
        ]);

        // buat barber profile
        return Barber::create([
            'user_id' => $user->id,
            'bio' => $data['bio'] ?? null,
            'photo_url' => $data['photo_url'] ?? null,
            'created_by_owner_id' => $owner->id,
        ]);
    }

    public function update(Barber $barber, array $data)
    {
        $barber->update($data);
        return $barber->fresh()->load('user');
    }

    public function delete(Barber $barber)
    {
        $barber->delete();
    }
}
