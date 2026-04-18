<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Api\BaseController;
use App\Models\BarbershopPhoto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BarbershopPhotoController extends BaseController
{
    public function store(Request $request)
    {
        $barbershop = $request->user()->barbershop;

        if ($barbershop->photos()->count() >= 4) {
            return response()->json(['success' => false, 'message' => 'Maximum 4 photos allowed.'], 422);
        }

        $request->validate([
            'photo' => 'required|image|max:2048',
        ]);

        $path = $request->file('photo')->store('barbershop-photos', 'public');

        $photo = $barbershop->photos()->create([
            'photo_url' => $path,
            'order'     => $barbershop->photos()->count(),
        ]);

        return response()->json([
            'success' => true,
            'data'    => [
                'id'        => $photo->id,
                'photo_url' => Storage::disk('public')->url($photo->photo_url),
            ],
        ], 201);
    }

    public function destroy(Request $request, $id)
    {
        $barbershopId = $request->user()->barbershop_id;

        $photo = BarbershopPhoto::where('id', $id)
            ->where('barbershop_id', $barbershopId)
            ->firstOrFail();

        Storage::disk('public')->delete($photo->photo_url);
        $photo->delete();

        return response()->json(['success' => true, 'message' => 'Photo deleted.']);
    }
}
