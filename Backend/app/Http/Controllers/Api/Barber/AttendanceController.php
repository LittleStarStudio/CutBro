<?php

namespace App\Http\Controllers\Api\Barber;

use App\Http\Controllers\Api\BaseController;

use App\Models\BarberAttendance;
use App\Models\BarberShiftAssignment;
use Carbon\Carbon;
use Illuminate\Http\Request;

class AttendanceController extends BaseController
{
    // GET /barber/attendance/today
    public function today(Request $request)
    {
        $barber = $request->user()->barber;
        $today  = Carbon::today();
        $dayInt = $today->dayOfWeek;

        $assignment = BarberShiftAssignment::with('shift')
            ->where('barber_id', $barber->id)
            ->where('day_of_week', $dayInt)
            ->first();

        if (!$assignment) {
            return $this->success(['has_shift_today' => false]);
        }

        $attendance = BarberAttendance::where('barber_shift_assignment_id', $assignment->id)
            ->where('date', $today->toDateString())
            ->first();

        return $this->success([
            'has_shift_today'   => true,
            'assignment_status' => $assignment->status,
            'shift' => [
                'label'      => $assignment->shift ? ucfirst($assignment->shift->name) : null,
                'start_time' => $assignment->shift ? substr($assignment->shift->start_time, 0, 5) : null,
                'end_time'   => $assignment->shift ? substr($assignment->shift->end_time, 0, 5) : null,
            ],
            'checked_in'     => $attendance !== null,
            'checked_out'    => $attendance?->actual_checkout !== null,
            'actual_checkin' => $attendance?->actual_checkin  ? substr($attendance->actual_checkin,  0, 5) : null,
            'actual_checkout'=> $attendance?->actual_checkout ? substr($attendance->actual_checkout, 0, 5) : null,
            'status'         => $attendance?->status ?? null,
            'late_minutes'   => $attendance?->late_minutes ?? 0,
        ]);

    }

    // POST /barber/attendance/checkin
    public function checkin(Request $request)
    {
        $barber = $request->user()->barber;
        $today  = Carbon::today();
        $dayInt = $today->dayOfWeek;

        $assignment = BarberShiftAssignment::with('shift')
            ->where('barber_id', $barber->id)
            ->where('day_of_week', $dayInt)
            ->where('status', 'active')
            ->first();

        if (!$assignment) {
            return $this->error('No active shift scheduled for today.', 422);
        }

        $existing = BarberAttendance::where('barber_shift_assignment_id', $assignment->id)
            ->where('date', $today->toDateString())
            ->first();

        if ($existing) {
            return $this->error('You have already checked in today at ' . substr($existing->actual_checkin, 0, 5) . '.', 422);
        }

        $now         = Carbon::now();
        $checkinTime = $now->format('H:i:s');
        $startMins   = $this->toMinutes($assignment->shift->start_time);
        $actualMins  = $this->toMinutes($checkinTime);
        $diff        = max(0, $actualMins - $startMins);
        $status      = $diff > 5 ? 'late' : 'on_time';
        $lateMinutes = $diff > 5 ? $diff : 0;

        $attendance = BarberAttendance::create([
            'barber_shift_assignment_id' => $assignment->id,
            'date'           => $today->toDateString(),
            'actual_checkin' => $checkinTime,
            'status'         => $status,
            'late_minutes'   => $lateMinutes,
        ]);

        return $this->success([
            'actual_checkin' => substr($attendance->actual_checkin, 0, 5),
            'status'         => $attendance->status,
            'late_minutes'   => $attendance->late_minutes,
        ], 'Check-in recorded successfully.');

    }

    public function checkout(Request $request)
    {
        $barber = $request->user()->barber;
        $today  = Carbon::today();
        $dayInt = $today->dayOfWeek;

        $assignment = BarberShiftAssignment::with('shift')
            ->where('barber_id', $barber->id)
            ->where('day_of_week', $dayInt)
            ->where('status', 'active')
            ->first();

        if (!$assignment) {
            return $this->error('No active shift found for today.', 422);
        }

        $attendance = BarberAttendance::where('barber_shift_assignment_id', $assignment->id)
            ->where('date', $today->toDateString())
            ->first();

        if (!$attendance) {
            return $this->error('You have not checked in yet.', 422);
        }

        if ($attendance->actual_checkout) {
            return $this->error('You have already checked out today at ' . substr($attendance->actual_checkout, 0, 5) . '.', 422);
        }

        $attendance->update([
            'actual_checkout' => Carbon::now()->format('H:i:s'),
        ]);

        return $this->success([
            'actual_checkout' => substr($attendance->actual_checkout, 0, 5),
        ], 'Check-out recorded successfully.');
    }

    private function toMinutes(string $time): int
    {
        [$h, $m] = explode(':', $time);
        return (int)$h * 60 + (int)$m;
    }
}
