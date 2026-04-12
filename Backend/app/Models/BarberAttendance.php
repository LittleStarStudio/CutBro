<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BarberAttendance extends Model
{
    protected $fillable = [
        'barber_shift_assignment_id',
        'date',
        'actual_checkin',
        'actual_checkout',
        'status',
        'late_minutes',
    ];

    public function assignment()
    {
        return $this->belongsTo(BarberShiftAssignment::class, 'barber_shift_assignment_id');
    }
}
