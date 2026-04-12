<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Controller;
use App\Models\Barber;
use App\Models\BarberShiftAssignment;
use App\Models\Shift;
use Illuminate\Http\Request;

class ShiftAssignmentController extends Controller
{
    private const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

    private function dayToInt(string $day): int
    {
        $index = array_search($day, self::DAYS);
        return $index !== false ? $index : 1; // default Monday
    }

    private function intToDay(int $index): string
    {
        return self::DAYS[$index] ?? 'Monday';
    }

    public function index(Request $request)
    {
        $barbershopId = $request->user()->barbershop_id;

        $assignments = BarberShiftAssignment::with(['barber.user', 'shift'])
            ->whereHas('barber', fn($q) => $q->where('barbershop_id', $barbershopId))
            ->get()
            ->map(fn($a) => [
                'id'          => $a->id,
                'barber_id'   => $a->barber_id,
                'barber_name' => $a->barber?->user?->name,
                'shift_id'    => $a->shift_id,
                'shift_label' => $a->shift ? ucfirst($a->shift->name) : null,
                'start_time'  => $a->shift ? substr($a->shift->start_time, 0, 5) : null,
                'end_time'    => $a->shift ? substr($a->shift->end_time, 0, 5) : null,
                'day_of_week' => $this->intToDay($a->day_of_week),
                'status'      => $a->status,
            ]);

        return response()->json(['success' => true, 'data' => $assignments]);
    }

    public function store(Request $request)
    {
        $barbershopId = $request->user()->barbershop_id;

        $request->validate([
            'barber_id'   => 'required|integer',
            'shift_id'    => 'required|integer',
            'day_of_week' => 'required|in:Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
            'status'      => 'nullable|in:active,off,leave',
        ]);

        // Verify barber belongs to this barbershop
        $barber = Barber::where('id', $request->barber_id)
            ->where('barbershop_id', $barbershopId)
            ->firstOrFail();

        // Verify shift belongs to this barbershop
        $shift = Shift::where('id', $request->shift_id)
            ->where('barbershop_id', $barbershopId)
            ->firstOrFail();
        
        if ($shift->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'This shift is inactive and cannot be assigned to a barber.',
            ], 422);
        }

        $dayInt = $this->dayToInt($request->day_of_week);

        // Check for duplicate (active records only)
        $exists = BarberShiftAssignment::where('barber_id', $barber->id)
            ->where('day_of_week', $dayInt)
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => "{$barber->user?->name} already has a shift on {$request->day_of_week}.",
            ], 422);
        }

        // If a soft-deleted record exists for same barber+day, restore it instead of inserting new
        $trashed = BarberShiftAssignment::withTrashed()
            ->where('barber_id', $barber->id)
            ->where('day_of_week', $dayInt)
            ->whereNotNull('deleted_at')
            ->first();

        if ($trashed) {
            $trashed->restore();
            $trashed->update([
                'shift_id' => $shift->id,
                'status'   => $request->status ?? 'active',
            ]);
            $assignment = $trashed;
        } else {
            $assignment = BarberShiftAssignment::create([
                'barber_id'   => $barber->id,
                'shift_id'    => $shift->id,
                'day_of_week' => $dayInt,
                'status'      => $request->status ?? 'active',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Shift assignment created successfully',
            'data'    => [
                'id'          => $assignment->id,
                'barber_id'   => $assignment->barber_id,
                'barber_name' => $barber->user?->name,
                'shift_id'    => $assignment->shift_id,
                'shift_label' => ucfirst($shift->name),
                'start_time'  => substr($shift->start_time, 0, 5),
                'end_time'    => substr($shift->end_time, 0, 5),
                'day_of_week' => $request->day_of_week,
                'status'      => $assignment->status,
            ],
        ], 201);
    }

    public function update(Request $request, BarberShiftAssignment $assignment)
    {
        $barbershopId = $request->user()->barbershop_id;

        // Verify ownership via barber
        if ($assignment->barber?->barbershop_id !== $barbershopId) {
            return response()->json(['success' => false, 'message' => 'Not found'], 404);
        }

        $request->validate([
            'barber_id'   => 'required|integer',
            'shift_id'    => 'required|integer',
            'day_of_week' => 'required|in:Sunday,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday',
            'status'      => 'nullable|in:active,off,leave',
        ]);

        $barber = Barber::where('id', $request->barber_id)->where('barbershop_id', $barbershopId)->firstOrFail();
        $shift  = Shift::where('id', $request->shift_id)->where('barbershop_id', $barbershopId)->firstOrFail();

        if ($shift->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'This shift is inactive and cannot be assigned to a barber.',
            ], 422);
        }

        $dayInt = $this->dayToInt($request->day_of_week);

        // Duplicate check (exclude self)
        $exists = BarberShiftAssignment::where('barber_id', $barber->id)
            ->where('day_of_week', $dayInt)
            ->where('id', '!=', $assignment->id)
            ->exists();

        if ($exists) {
            return response()->json([
                'success' => false,
                'message' => "{$barber->user?->name} already has a shift on {$request->day_of_week}.",
            ], 422);
        }

        $assignment->update([
            'barber_id'   => $barber->id,
            'shift_id'    => $shift->id,
            'day_of_week' => $dayInt,
            'status'      => $request->status ?? $assignment->status,
        ]);

        return response()->json(['success' => true, 'message' => 'Shift assignment updated successfully']);
    }

    public function destroy(Request $request, BarberShiftAssignment $assignment)
    {
        $barbershopId = $request->user()->barbershop_id;

        if ($assignment->barber?->barbershop_id !== $barbershopId) {
            return response()->json(['success' => false, 'message' => 'Not found'], 404);
        }

        $assignment->delete();

        return response()->json(['success' => true, 'message' => 'Shift assignment deleted successfully']);
    }
}
