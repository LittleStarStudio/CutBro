<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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
            'password' => 'nullable|string|min:8'
        ]);

        $updatedUser = $this->profileService->update($user, $validated);

        return $this->success([
            'user' => [
                'id'         => $updatedUser->id,
                'name'       => $updatedUser->name,
                'email'      => $updatedUser->email,
                'avatar_url' => $updatedUser->avatar_url
                                ? Storage::disk('public')->url($updatedUser->avatar_url)
                                : null,
            ]
        ]);

    }

    public function avatar(Request $request)
    {
        $request->validate([
            'avatar' => 'required|image|max:5120',
        ]);

        $user = $request->user();

        if ($user->avatar_url) {
            Storage::disk('public')->delete($user->avatar_url);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar_url' => $path]);

        return $this->success([
            'avatar_url' => Storage::disk('public')->url($path),
        ]);
    }

}
