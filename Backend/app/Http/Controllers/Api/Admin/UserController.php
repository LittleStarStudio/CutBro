<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\BaseController;
use App\Models\Role;
use App\Models\User;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

use Carbon\Carbon;

class UserController extends BaseController
{
    public function stats()
    {
        $excludeRoleId = Role::where('name', 'super_admin')->value('id');

        return $this->success([
            'total'     => User::where('role_id', '!=', $excludeRoleId)->count(),
            'customers' => User::whereHas('role', fn($q) => $q->where('name', 'customer'))->count(),
            'barbers'   => User::whereHas('role', fn($q) => $q->where('name', 'barber'))->count(),
            'owners'    => User::whereHas('role', fn($q) => $q->where('name', 'owner'))->count(),
        ]);
    }

    public function index(Request $request)
    {
        $excludeRoleId = Role::where('name', 'super_admin')->value('id');

        $users = User::with('role')
            ->addSelect([
                'last_success_login' => DB::table('login_logs')
                    ->select('created_at')
                    ->whereColumn('user_id', 'users.id')
                    ->whereIn('status', ['success', 'google_login'])
                    ->latest()
                    ->limit(1)
            ])
            ->where('role_id', '!=', $excludeRoleId)
            ->orderBy('created_at', 'desc')
            ->paginate(min((int) $request->get('per_page', 10), 500));

        return $this->success([
            'data' => $users->map(fn($u) => [
                'id'         => $u->id,
                'name'       => $u->name,
                'email'      => $u->email,
                'role'       => $u->role?->name ?? '-',
                'status'     => $u->status,
                'join_date'  => $u->created_at?->format('Y-m-d'),
                'last_login' => $u->last_success_login
                    ? Carbon::parse($u->last_success_login)->format('Y-m-d H:i')
                    : null,
                'avatar_url' => $u->avatar_url
                    ? Storage::disk('public')->url($u->avatar_url)
                    : null,
            ]),
            'current_page' => $users->currentPage(),
            'last_page'    => $users->lastPage(),
            'per_page'     => $users->perPage(),
            'total'        => $users->total(),
        ]);
    }

    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'name'   => 'sometimes|string|min:3|max:255',
            'email'  => 'sometimes|email|unique:users,email,' . $id,
            'role'   => 'sometimes|in:customer,barber,owner',
            'status' => 'sometimes|in:active,inactive,banned',
        ]);

        if (isset($validated['role'])) {
            $role = Role::where('name', $validated['role'])->firstOrFail();
            $user->role_id = $role->id;

            // Clear barbershop_id if role changed to customer
            if ($validated['role'] === 'customer') {
                $user->barbershop_id = null;
            }

            unset($validated['role']);
        }

        $user->update($validated);

        // Handle base64 avatar upload
        if ($request->filled('avatar_base64')) {
            $base64    = preg_replace('#^data:image/\w+;base64,#i', '', $request->avatar_base64);
            $imageData = base64_decode($base64);

            if ($imageData === false) {
                return $this->error('Invalid image data. Please upload a valid image.', 422);
            }

            if ($user->avatar_url) {
                Storage::disk('public')->delete($user->avatar_url);
            }

            $filename = 'avatars/' . uniqid() . '.jpg';
            Storage::disk('public')->put($filename, $imageData);
            $user->avatar_url = $filename;
            $user->save();
        }

        return $this->success([], 'User updated successfully.');
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);

        if ($user->status !== 'banned') {
            return $this->error('Only banned users can be deleted.', 422);
        }

        $user->delete();

        return $this->success([], 'User deleted successfully.');
    }
}
