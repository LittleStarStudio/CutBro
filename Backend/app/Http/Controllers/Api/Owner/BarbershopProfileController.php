<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\OperationalHour;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class BarbershopProfileController extends Controller
{
    private const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

    public function show(Request $request)
    {
        $barbershop = $request->user()->barbershop;

        if (!$barbershop) {
            return response()->json(['success' => false, 'message' => 'Barbershop not found'], 404);
        }

        $hours = OperationalHour::where('barbershop_id', $barbershop->id)
            ->orderBy('day_of_week')
            ->get()
            ->map(fn($h) => [
                'day'        => self::DAYS[$h->day_of_week],
                'is_open'    => !$h->is_closed,
                'open_time'  => $h->open_time,
                'close_time' => $h->close_time,
            ]);

        $photos = [];
        if ($barbershop->logo_url) {
            $photos[] = Storage::disk('public')->url($barbershop->logo_url);
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'name'              => $barbershop->name,
                'slug'              => $barbershop->slug,
                'address'           => $barbershop->address,
                'phone'             => $barbershop->phone,
                'description'       => $barbershop->description,
                'photos'            => $photos,
                'operational_hours' => $hours,
            ],
        ]);
    }

    public function update(Request $request)
    {
        $barbershop = $request->user()->barbershop;

        if (!$barbershop) {
            return response()->json(['success' => false, 'message' => 'Barbershop not found'], 404);
        }

        $request->validate([
            'name'                          => 'required|string|max:255',
            'address'                       => 'required|string',
            'phone'                         => 'required|string|max:20',
            'description'                   => 'nullable|string',
            'photo'                         => 'nullable|image|max:2048',
            'operational_hours'             => 'nullable|array',
            'operational_hours.*.day'       => 'required|string|in:Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
            'operational_hours.*.is_open'   => 'required|boolean',
            'operational_hours.*.open_time' => 'nullable|date_format:H:i',
            'operational_hours.*.close_time'=> 'nullable|date_format:H:i',
        ]);

        // Update basic fields
        $barbershop->name        = $request->name;
        $barbershop->address     = $request->address;
        $barbershop->phone       = $request->phone;
        $barbershop->description = $request->description;

        // Handle photo upload
        if ($request->hasFile('photo')) {
            if ($barbershop->logo_url) {
                Storage::disk('public')->delete($barbershop->logo_url);
            }
            $path = $request->file('photo')->store('barbershops', 'public');
            $barbershop->logo_url = $path;
        }

        $barbershop->save();

        // Update operational hours
        if ($request->has('operational_hours')) {
            foreach ($request->operational_hours as $hour) {
                $dayIndex = array_search($hour['day'], self::DAYS);
                if ($dayIndex === false) continue;

                OperationalHour::updateOrCreate(
                    ['barbershop_id' => $barbershop->id, 'day_of_week' => $dayIndex],
                    [
                        'is_closed'  => !($hour['is_open'] ?? true),
                        'open_time'  => $hour['open_time']  ?? '09:00',
                        'close_time' => $hour['close_time'] ?? '21:00',
                    ]
                );
            }
        }

        return response()->json([
            'success' => true,
            'message' => 'Barbershop updated successfully',
        ]);
    }
}
