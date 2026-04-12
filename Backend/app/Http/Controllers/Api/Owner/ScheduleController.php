<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Api\BaseController;
use App\Models\BarberAttendance;
use App\Models\BarberShiftAssignment;
use Carbon\Carbon;
use Illuminate\Http\Request;

class ScheduleController extends BaseController
{
    private const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];

    // GET /owner/schedule?date=YYYY-MM-DD
    public function index(Request $request)
    {
        $barbershopId = $request->user()->barbershop_id;
        $date   = $request->query('date', Carbon::today()->toDateString());
        $carbon = Carbon::parse($date);
        $dayInt = $carbon->dayOfWeek;

        $assignments = BarberShiftAssignment::with(['barber.user', 'shift'])
            ->whereHas('barber', fn($q) => $q->where('barbershop_id', $barbershopId))
            ->where('day_of_week', $dayInt)
            ->get();

        $assignmentIds = $assignments->pluck('id');
        $attendances   = BarberAttendance::whereIn('barber_shift_assignment_id', $assignmentIds)
            ->where('date', $date)
            ->get()
            ->keyBy('barber_shift_assignment_id');

        $data = $assignments->map(function ($a) use ($date, $attendances) {
            $att = $attendances->get($a->id);
            return [
                'attendance_id'     => $att?->id,
                'assignment_id'     => $a->id,
                'barber_id'         => $a->barber_id,
                'barber_name'       => $a->barber?->user?->name ?? '-',
                'barber_email'      => $a->barber?->user?->email ?? '-',
                'barber_photo'      => $a->barber?->photo_url ?? null,
                'day'               => self::DAYS[$a->day_of_week] ?? 'Monday',
                'date'              => $date,
                'shift_label'       => $a->shift ? ucfirst($a->shift->name) : null,
                'scheduled_start'   => $a->shift ? substr($a->shift->start_time, 0, 5) : null,
                'scheduled_end'     => $a->shift ? substr($a->shift->end_time, 0, 5) : null,
                'assignment_status' => $a->status,
                'actual_checkin'    => $att?->actual_checkin  ? substr($att->actual_checkin,  0, 5) : null,
                'actual_checkout'   => $att?->actual_checkout ? substr($att->actual_checkout, 0, 5) : null,   // ← tambahkan
                'status'            => $att?->status ?? 'absent',
                'late_minutes'      => $att?->late_minutes ?? 0,
                'has_attendance'    => $att !== null,
            ];
        });

        return $this->success($data);
    }

    // PUT /owner/schedule/{assignmentId}/attendance
    public function updateAttendance(Request $request, $assignmentId)
    {
        $barbershopId = $request->user()->barbershop_id;

        $assignment = BarberShiftAssignment::with(['barber', 'shift'])
            ->whereHas('barber', fn($q) => $q->where('barbershop_id', $barbershopId))
            ->findOrFail($assignmentId);

        $request->validate([
            'date'           => 'required|date',
            'actual_checkin' => 'nullable|date_format:H:i',
            'status'         => 'required|in:on_time,late,absent',
            'late_minutes'   => 'nullable|integer|min:0',
        ]);

        if ($request->status === 'late' && !$request->actual_checkin) {
            return $this->error('Actual check-in time is required for late status.', 422);
        }

        $lateMinutes   = 0;
        $actualCheckin = $request->actual_checkin;

        if ($actualCheckin && $assignment->shift) {
            $startMins  = $this->toMinutes($assignment->shift->start_time);
            $actualMins = $this->toMinutes($actualCheckin);
            $diff       = max(0, $actualMins - $startMins);
            $lateMinutes = ($request->status === 'late') ? ($request->late_minutes ?? $diff) : 0;
        } elseif ($request->status === 'late') {
            $lateMinutes = $request->late_minutes ?? 0;
        }

        $updateData = [
            'actual_checkin' => $actualCheckin ? $actualCheckin . ':00' : null,
            'status'         => $request->status,
            'late_minutes'   => $lateMinutes,
        ];

        if (!$actualCheckin) {
            $updateData['actual_checkout'] = null;
        }

        BarberAttendance::updateOrCreate(
            [
                'barber_shift_assignment_id' => $assignment->id,
                'date'                       => $request->date,
            ],
            $updateData
        );

        return $this->success([], 'Attendance updated successfully.');
    }

    private function toMinutes(string $time): int
    {
        [$h, $m] = explode(':', $time);
        return (int)$h * 60 + (int)$m;
    }
}