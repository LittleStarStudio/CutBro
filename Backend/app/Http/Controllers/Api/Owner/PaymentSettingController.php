<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\PaymentSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PaymentSettingController extends Controller
{
    public function show(Request $request)
    {
        $barbershopId = $request->user()->barbershop_id;
        $setting = PaymentSetting::where('barbershop_id', $barbershopId)->first();

        $data = $setting ? [
            'bank_name'      => $setting->bank_name,
            'account_number' => $setting->account_number,
            'account_holder' => $setting->account_holder,
            'qris_image_url' => $setting->qris_image_path
                ? Storage::disk('public')->url($setting->qris_image_path)
                : null,
        ] : [
            'bank_name'      => null,
            'account_number' => null,
            'account_holder' => null,
            'qris_image_url' => null,
        ];

        return response()->json(['success' => true, 'data' => $data]);
    }

    public function upsert(Request $request)
    {
        $barbershopId = $request->user()->barbershop_id;

        $request->validate([
            'bank_name'      => 'required|string|max:100',
            'account_number' => 'required|string|max:50',
            'account_holder' => 'required|string|max:100',
            'qris_image'     => 'nullable|image|max:2048',
        ]);

        $setting = PaymentSetting::firstOrNew(['barbershop_id' => $barbershopId]);

        $setting->bank_name      = $request->bank_name;
        $setting->account_number = $request->account_number;
        $setting->account_holder = $request->account_holder;

        if ($request->hasFile('qris_image')) {
            if ($setting->qris_image_path) {
                Storage::disk('public')->delete($setting->qris_image_path);
            }
            $setting->qris_image_path = $request->file('qris_image')->store('qris', 'public');
        }

        $setting->save();

        return response()->json(['success' => true, 'message' => 'Payment settings saved successfully']);
    }
}
