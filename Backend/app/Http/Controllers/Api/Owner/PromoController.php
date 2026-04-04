<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\Promo;
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
            'name'             => 'required|string|max:255',
            'original_price'   => 'required|integer|min:1000',
            'discount_percent' => 'required|integer|min:1|max:99',
        ]);

        $finalPrice = (int) round($request->original_price - ($request->original_price * $request->discount_percent / 100));

        $promo = Promo::create([
            'barbershop_id'    => $request->user()->barbershop_id,
            'name'             => $request->name,
            'original_price'   => $request->original_price,
            'discount_percent' => $request->discount_percent,
            'final_price'      => $finalPrice,
            'is_active'        => true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Promo created successfully',
            'data'    => [
                'id'               => $promo->id,
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
            'name'             => 'required|string|max:255',
            'original_price'   => 'required|integer|min:1000',
            'discount_percent' => 'required|integer|min:1|max:99',
        ]);

        $finalPrice = (int) round($request->original_price - ($request->original_price * $request->discount_percent / 100));

        $promo->update([
            'name'             => $request->name,
            'original_price'   => $request->original_price,
            'discount_percent' => $request->discount_percent,
            'final_price'      => $finalPrice,
        ]);

        return response()->json(['success' => true, 'message' => 'Promo updated successfully']);
    }

    public function destroy(Request $request, Promo $promo)
    {
        if ($promo->barbershop_id !== $request->user()->barbershop_id) {
            return response()->json(['success' => false, 'message' => 'Not found'], 404);
        }

        $promo->delete();

        return response()->json(['success' => true, 'message' => 'Promo deleted successfully']);
    }
}
