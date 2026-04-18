<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Api\BaseController;
use App\Models\Barbershop;
use App\Models\User;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BarbershopController extends BaseController
{
    /**
     * GET /admin/barbershops/stats
     * Returns plan-based counts for stat cards.
     */
    public function stats()
    {
        return $this->success([
            'total'   => Barbershop::count(),
            'free'    => Barbershop::where('subscription_plan', 'free')->count(),
            'pro'     => Barbershop::where('subscription_plan', 'pro')->count(),
            'premium' => Barbershop::where('subscription_plan', 'premium')->count(),
        ]);
    }

    /**
     * GET /admin/barbershops
     * Paginated list of all barbershops.
     */
    public function index(Request $request)
    {
        $all = Barbershop::with(['barbers', 'users.role'])
            ->withSum(['bookings as total_revenue' => function ($q) {
                $q->whereIn('status', ['paid', 'done']);
            }], 'total_price')
            ->orderBy('created_at', 'desc')
            ->get();

        $data = $all->map(function ($shop) {
            // Owner sudah di-eager load, tidak perlu query baru
            $owner = $shop->users->first(function ($u) {
                return $u->role?->name === 'owner';
            });

            // Revenue sudah di-eager load via withSum
            $revenue = $shop->total_revenue ?? 0;

            return [
                'id'       => $shop->id,
                'name'     => $shop->name,
                'owner'    => $owner?->name ?? '-',
                'owner_id' => $owner?->id ?? null,
                'location' => $shop->city,
                'plan'     => ucfirst($shop->subscription_plan ?? 'free'),
                'barbers'  => $shop->barbers->count(),
                'status'   => $shop->status,
                'revenue'  => $revenue,
                'rate'     => 0.0,
                'logo_url' => $shop->logo_url
                    ? Storage::disk('public')->url($shop->logo_url)
                    : null,
            ];
        });

        return $this->success([
            'data'  => $data,
            'total' => $all->count(),
        ]);
    }

    /**
     * PUT /admin/barbershops/{id}
     * Update editable fields. Owner name is updated via users table.
     */
    public function update(Request $request, $id)
    {
        $barbershop = Barbershop::findOrFail($id);

        $validated = $request->validate([
            'name'              => 'sometimes|required|string|min:3',
            'owner_name'        => 'sometimes|nullable|string',
            'city'              => 'sometimes|required|string',
            'subscription_plan' => 'sometimes|required|in:free,pro,premium',
            'status'            => 'sometimes|required|in:active,inactive',
        ]);

        $barbershop->update([
            'name'              => $validated['name']              ?? $barbershop->name,
            'city'              => $validated['city']              ?? $barbershop->city,
            'subscription_plan' => $validated['subscription_plan'] ?? $barbershop->subscription_plan,
            'status'            => $validated['status']            ?? $barbershop->status,
        ]);

        // Handle base64 photo upload
        if ($request->filled('photo_base64')) {
            $base64    = preg_replace('#^data:image/\w+;base64,#i', '', $request->photo_base64);
            $imageData = base64_decode($base64);

            if ($imageData === false) {
                return $this->error('Invalid image data. Please upload a valid image.', 422);
            }

            if ($barbershop->logo_url) {
                Storage::disk('public')->delete($barbershop->logo_url);
            }

            $filename = 'barbershops/' . uniqid() . '.jpg';
            Storage::disk('public')->put($filename, $imageData);
            $barbershop->logo_url = $filename;
            $barbershop->save();
        }

        // Update owner's name in users table
        if (!empty($validated['owner_name'])) {
            $owner = User::where('barbershop_id', $barbershop->id)
                ->whereHas('role', fn ($q) => $q->where('name', 'owner'))
                ->first();
            if ($owner) {
                $owner->update(['name' => $validated['owner_name']]);
            }
        }

        return $this->success(null, 'Barbershop updated successfully');
    }

    /**
     * DELETE /admin/barbershops/{id}
     * Soft delete — only allowed when status = inactive.
     */
    public function destroy($id)
    {
        $barbershop = Barbershop::findOrFail($id);

        if ($barbershop->status === 'active') {
            return $this->error('Barbershop aktif tidak dapat dihapus', 422);
        }

        $barbershop->delete(); // soft delete via SoftDeletes trait

        return $this->success(null, 'Barbershop deleted successfully');
    }
}
