<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;

use App\Models\Promo;
use App\Models\Service;
use Illuminate\Validation\Rule;

use Illuminate\Http\Request;

class PromoController extends Controller
{
    public function index(Request $request)
    {
        $promos = Promo::where('barbershop_id', $request->user()->barbershop_id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(fn($p) => [
                'id'               => $p->id,
                'service_id'       => $p->service_id,
                'name'             => $p->name,
                'original_price'   => $p->original_price,
                'discount_percent' => $p->discount_percent,
                'final_price'      => $p->final_price,
                'is_active'        => $p->is_active,
            ]);

        return response()->json(['success' => true, 'data' => $promos]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'service_id'       => [
                'required',
                Rule::exists('services', 'id')
                    ->where('barbershop_id', $request->user()->barbershop_id)
                    ->whereNull('deleted_at'),
                Rule::unique('promos', 'service_id')
                    ->where('barbershop_id', $request->user()->barbershop_id),
            ],
            'discount_percent' => 'required|integer|min:1|max:99',
            'is_active'        => 'sometimes|boolean',
        ]);

        $service = Service::find($request->service_id);

        if (!$service) {
            return response()->json(['success' => false, 'message' => 'Service not found.'], 422);
        }

        $originalPrice = (int) $service->price;
        $finalPrice    = (int) round($originalPrice - ($originalPrice * $request->discount_percent / 100));

        $promo = Promo::create([
            'barbershop_id'    => $request->user()->barbershop_id,
            'service_id'       => $service->id,
            'name'             => $service->name,
            'original_price'   => $originalPrice,
            'discount_percent' => $request->discount_percent,
            'final_price'      => $finalPrice,
            'is_active'        => $request->input('is_active', true),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Promo created successfully',
            'data'    => [
                'id'               => $promo->id,
                'service_id'       => $promo->service_id,
                'name'             => $promo->name,
                'original_price'   => $promo->original_price,
                'discount_percent' => $promo->discount_percent,
                'final_price'      => $promo->final_price,
                'is_active'        => $promo->is_active,
            ],
        ], 201);
    }

    public function update(Request $request, Promo $promo)
    {
        if ($promo->barbershop_id !== $request->user()->barbershop_id) {
            return response()->json(['success' => false, 'message' => 'Not found'], 404);
        }

        $request->validate([
            'service_id'       => [
                'required',
                Rule::exists('services', 'id')
                    ->where('barbershop_id', $request->user()->barbershop_id)
                    ->whereNull('deleted_at'),
                Rule::unique('promos', 'service_id')
                    ->where('barbershop_id', $request->user()->barbershop_id)
                    ->ignore($promo->id),
            ],
            'discount_percent' => 'required|integer|min:1|max:99',
            'is_active'        => 'sometimes|boolean',
        ]);

        $service = Service::find($request->service_id);
        if (!$service) {
            return response()->json(['success' => false, 'message' => 'Service not found.'], 422);
        }

        $originalPrice = (int) $service->price;
        $finalPrice    = (int) round($originalPrice - ($originalPrice * $request->discount_percent / 100));

        $promo->update([
            'service_id'       => $service->id,
            'name'             => $service->name,
            'original_price'   => $originalPrice,
            'discount_percent' => $request->discount_percent,
            'final_price'      => $finalPrice,
            'is_active'        => $request->input('is_active', $promo->is_active),
        ]);

        return response()->json(['success' => true, 'message' => 'Promo updated successfully']);
    }

    public function destroy(Request $request, Promo $promo)
    {
        if ($promo->barbershop_id !== $request->user()->barbershop_id) {
            return response()->json(['success' => false, 'message' => 'Not found'], 404);
        }

        // Guard: tidak bisa hapus jika promo masih Active
        if ($promo->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Cannot delete an active promo. Please set the promo to Inactive first.',
            ], 422);
        }

        $promo->delete();

        return response()->json(['success' => true, 'message' => 'Promo deleted successfully']);
    }
}
