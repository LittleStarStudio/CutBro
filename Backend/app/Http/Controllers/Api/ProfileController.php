<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use App\Services\ProfileService;

class ProfileController extends BaseController
{
    protected $profileService;

    public function __construct(ProfileService $profileService)
    {
        $this->profileService = $profileService;
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'avatar_url' => 'nullable|string|max:255',
            'password' => 'nullable|string|min:6'
        ]);

        $updatedUser = $this->profileService->update($user, $validated);

        return $this->success([
            'user' => [
                'id' => $updatedUser->id,
                'name' => $updatedUser->name,
                'email' => $updatedUser->email,
                'avatar_url' => $updatedUser->avatar_url
            ]
        ]);
    }
}
