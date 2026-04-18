<?php

namespace App\Http\Controllers\Api\Barber;

use App\Http\Controllers\Api\BaseController;

use App\Models\BarberAttendance;
use App\Models\BarberShiftAssignment;
use App\Models\Barber;
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

    public function weeklySchedule(Request $request)
    {
        $user = $request->user();

        $barber = Barber::where('user_id', $user->id)->first();
        if (!$barber) {
            return $this->error('Barber profile not found.', 404);
        }

        $daysNumToName = [
            0 => 'Sunday', 1 => 'Monday', 2 => 'Tuesday',
            3 => 'Wednesday', 4 => 'Thursday', 5 => 'Friday', 6 => 'Saturday',
        ];

        // Mulai dari Minggu minggu ini
        $weekStart = Carbon::now()->startOfWeek(Carbon::SUNDAY);

        $assignments = BarberShiftAssignment::with(['shift'])
            ->where('barber_id', $barber->id)
            ->get();

        $assignmentsByDay = $assignments->keyBy('day_of_week');

        // Ambil semua attendance minggu ini sekaligus (1 query)
        $assignmentIds = $assignments->pluck('id');
        $weekEnd       = $weekStart->copy()->addDays(6);

        $attendances = BarberAttendance::whereIn('barber_shift_assignment_id', $assignmentIds)
            ->whereBetween('date', [$weekStart->toDateString(), $weekEnd->toDateString()])
            ->get()
            ->keyBy('barber_shift_assignment_id');

        $result = [];

        for ($i = 0; $i < 7; $i++) {
            $date       = $weekStart->copy()->addDays($i);
            $dayInt     = $date->dayOfWeek;
            $dayName    = $daysNumToName[$dayInt];
            $assignment = $assignmentsByDay->get($dayInt);

            if ($assignment && $assignment->shift) {
                $attendance = $attendances->get($assignment->id);

                $result[$dayName] = [
                    'shift_name'      => $assignment->shift->name,
                    'start_time'      => substr($assignment->shift->start_time, 0, 5),
                    'end_time'        => substr($assignment->shift->end_time, 0, 5),
                    'actual_checkin'  => $attendance?->actual_checkin
                                            ? substr($attendance->actual_checkin, 0, 5)
                                            : null,
                    'actual_checkout' => $attendance?->actual_checkout
                                            ? substr($attendance->actual_checkout, 0, 5)
                                            : null,
                ];
            } else {
                $result[$dayName] = null;
            }
        }

        return $this->success($result);
    }

    
}
