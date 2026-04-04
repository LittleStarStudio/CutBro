<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\Shift;
use Illuminate\Http\Request;

class ShiftController extends Controller
{
    // The 3 canonical shift presets every barbershop should have
    private const PRESETS = [
        ['name' => 'morning',   'label' => 'Morning',   'start' => '07:00', 'end' => '13:00'],
        ['name' => 'afternoon', 'label' => 'Afternoon', 'start' => '13:00', 'end' => '19:00'],
        ['name' => 'evening',   'label' => 'Evening',   'start' => '19:00', 'end' => '22:00'],
    ];

    public function index(Request $request)
    {
        $barbershopId = $request->user()->barbershop_id;

        // Auto-create shifts if they don't exist yet for this barbershop
        foreach (self::PRESETS as $preset) {
            Shift::firstOrCreate(
                ['barbershop_id' => $barbershopId, 'name' => $preset['name']],
                ['start_time' => $preset['start'], 'end_time' => $preset['end'], 'status' => 'active']
            );
        }

        $shifts = Shift::where('barbershop_id', $barbershopId)
            ->whereIn('name', array_column(self::PRESETS, 'name'))
            ->get()
            ->map(fn($s) => [
                'id'         => $s->id,
                'name'       => $s->name,
                'label'      => ucfirst($s->name),
                'start_time' => substr($s->start_time, 0, 5),
                'end_time'   => substr($s->end_time, 0, 5),
                'status'     => $s->status,
            ]);

        return response()->json(['success' => true, 'data' => $shifts]);
    }

    public function upsert(Request $request)
    {
        $barbershopId = $request->user()->barbershop_id;

        $request->validate([
            'shifts'             => 'required|array',
            'shifts.*.name'      => 'required|in:morning,afternoon,evening',
            'shifts.*.start_time'=> 'required|date_format:H:i',
            'shifts.*.end_time'  => 'required|date_format:H:i',
            'shifts.*.status'    => 'required|in:active,inactive',
        ]);

        foreach ($request->shifts as $data) {
            Shift::updateOrCreate(
                ['barbershop_id' => $barbershopId, 'name' => $data['name']],
                ['start_time' => $data['start_time'], 'end_time' => $data['end_time'], 'status' => $data['status']]
            );
        }

        return response()->json(['success' => true, 'message' => 'Shifts updated successfully']);
    }
}
