<?php

namespace App\Services;

use App\Models\User;
use Illuminate\Support\Facades\Hash;

class ProfileService
{
    public function update(User $user, array $data): User
    {
        // Update name
        if (isset($data['name'])) {
            $user->name = $data['name'];
        }

        // Update avatar_url
        if (isset($data['avatar_url'])) {
            $user->avatar_url = $data['avatar_url'];
        }

        // Update password (optional)
        if (!empty($data['password'])) {
            $user->password = Hash::make($data['password']);
        }

        $user->save();

        return $user->fresh();
    }
}