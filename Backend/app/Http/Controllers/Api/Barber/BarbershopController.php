<?php

namespace App\Http\Controllers\Api\Barber;

use App\Http\Controllers\Api\BaseController;
use Illuminate\Http\Request;
use App\Models\Barbershop;

class BarbershopController extends BaseController
{
    public function show(Request $request)
    {
        $barber = $request->user()->barber;
        
        if (!$barber) {
            return response()->json([
                'success' => false,
                'message' => 'Barber profile not found'
            ], 404);
        }

        $barbershop = Barbershop::with(['photos', 'operationalHours'])
            ->find($barber->barbershop_id);

        if (!$barbershop) {
            return response()->json([
                'success' => false,
                'message' => 'Barbershop not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $barbershop
        ]);
    }
}