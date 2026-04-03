<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\Service;
use App\Models\Barber;
use App\Models\BarbershopUserBlock;
use App\Models\OperationalHour;
use App\Models\BarberShiftAssignment;
use App\Models\Shift;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

class BookingService
{
    public function create(array $data)
    {
        $customer = Auth::user();

        // Ambil service
        $service = Service::findOrFail($data['service_id']);

        if (!$service->is_active) {
            abort(400, 'Service is not available');
        }

        /// Ambil barber
        $barber = Barber::findOrFail($data['barber_id']);

        // CEK: barber status aktif atau tidak
        if ($barber->status !== 'available') {
            abort(400, 'Barber is not available');
        }

        // Validasi barber & service harus satu barbershop
        if ($barber->barbershop_id !== $service->barbershop_id) {
            abort(403, 'Invalid barber for this service');
        }

        // VALIDASI TENANT
        if ($customer->barbershop_id && $customer->barbershop_id !== $service->barbershop_id) {
            abort(403, 'Unauthorized barbershop access');
        }

        // Cek customer diblok atau tidak
        $blocked = BarbershopUserBlock::where('barbershop_id', $service->barbershop_id)
            ->where('user_id', $customer->id)
            ->whereNull('deleted_at')
            ->exists();

        if ($blocked) {
            abort(403, 'You are blocked by this barbershop');
        }

        // Validasi tanggal
        $bookingDate = Carbon::createFromFormat('Y-m-d', $data['booking_date'], 'Asia/Jakarta');

        $now = Carbon::now('Asia/Jakarta');
        $today = $now->copy()->startOfDay();

        if ($bookingDate->lt($today)) {
            abort(400, 'Cannot book in the past');
        }

        /// Validasi jam
        $start = Carbon::createFromFormat(
            'Y-m-d H:i',
            $bookingDate->format('Y-m-d') . ' ' . $data['start_time'],
            'Asia/Jakarta'
        );

        $end = $start->copy()->addMinutes($service->duration_minutes);

        // Validasi jam operasional barbershop
        $dayOfWeek = $bookingDate->dayOfWeek; // 0=Sunday, 6=Saturday

        $operationalHour = OperationalHour::where('barbershop_id', $service->barbershop_id)
            ->where('day_of_week', $dayOfWeek)
            ->first();

        // Jika belum disetting (safety)
        if (!$operationalHour || !$operationalHour->open_time || !$operationalHour->close_time) {
            abort(400, 'Barbershop operational hours not properly configured');
        }

        // Jika toko tutup di hari tersebut
        if ($operationalHour->is_closed) {
            abort(400, 'Barbershop is closed on selected day');
        }

        // Ambil jam buka & tutup toko
        $openTime = Carbon::createFromFormat(
            'Y-m-d H:i:s',
            $bookingDate->format('Y-m-d') . ' ' . $operationalHour->open_time,
            'Asia/Jakarta'
        );

        $closeTime = Carbon::createFromFormat(
            'Y-m-d H:i:s',
            $bookingDate->format('Y-m-d') . ' ' . $operationalHour->close_time,
            'Asia/Jakarta'
        );

        // Validasi booking tidak boleh sebelum buka
        if ($start->lt($openTime)) {
            abort(400, 'Booking time is before opening hours');
        }

        // Validasi booking tidak boleh melewati jam tutup
        if ($end->gt($closeTime)) {
            abort(400, 'Booking exceeds closing hours');
        }

        // Jika booking hari ini
        if ($bookingDate->isSameDay($today)) {
            if ($start->lt($now)) {
                abort(400, 'Cannot book past time');
            }
        }

        // Validasi shift barber
        // Ambil assignment barber
        $assignment = BarberShiftAssignment::where('barber_id', $barber->id)
            ->where('day_of_week', $dayOfWeek)
            ->first();

        // Jika barber tidak kerja hari itu
        if (!$assignment) {
            abort(400, 'Barber is not working on selected day');
        }

        // Ambil shift & pastikan aktif
        $shift = Shift::where('id', $assignment->shift_id)
            ->where('status', 'active')
            ->where('barbershop_id', $barber->barbershop_id)
            ->first();

        if (!$shift) {
            abort(400, 'Invalid or inactive barber shift');
        }

        // Ambil jam shift
        $shiftStart = Carbon::createFromFormat(
            'Y-m-d H:i:s',
            $bookingDate->format('Y-m-d') . ' ' . $shift->start_time,
            'Asia/Jakarta'
        );

        $shiftEnd = Carbon::createFromFormat(
            'Y-m-d H:i:s',
            $bookingDate->format('Y-m-d') . ' ' . $shift->end_time,
            'Asia/Jakarta'
        );

        // Validasi booking harus dalam jam shift
        if ($start->lt($shiftStart) || $end->gt($shiftEnd)) {
            abort(400, 'Booking time is outside barber shift');
        }

        // CEK DOUBLE BOOKING (OVERLAP)
        $conflict = Booking::where('barber_id', $barber->id)
            ->whereDate('booking_date', $bookingDate->format('Y-m-d'))
            ->whereIn('status', [Booking::STATUS_PENDING_PAYMENT, Booking::STATUS_PAID, Booking::STATUS_DONE])
            ->where(function ($query) use ($start, $end) {
                $query->where('start_time', '<', $end->format('H:i:s'))
                    ->where('end_time', '>', $start->format('H:i:s'));
            })
            ->exists();

        if ($conflict) {
            abort(400, 'Selected time is not available');
        }

        $customerConflict = Booking::where('customer_id', $customer->id)
            ->whereDate('booking_date', $bookingDate->format('Y-m-d'))
            ->whereIn('status', [Booking::STATUS_PENDING_PAYMENT, Booking::STATUS_PAID, Booking::STATUS_DONE])
            ->where(function ($query) use ($start, $end) {
                $query->where('start_time', '<', $end->format('H:i:s'))
                    ->where('end_time', '>', $start->format('H:i:s'));
            })
            ->exists();

        if ($customerConflict) {
            abort(400, 'You already have booking at this time');
        }

        return Booking::create([
            'barbershop_id' => $service->barbershop_id,
            'customer_id'   => $customer->id,
            'barber_id'     => $barber->id,
            'service_id'    => $service->id,
            'booking_date'  => $bookingDate->format('Y-m-d'),
            'start_time'    => $start->format('H:i:s'),
            'end_time'      => $end->format('H:i:s'),
            'total_price'   => $service->price,
            'status'        => Booking::STATUS_PENDING_PAYMENT
        ]);
    }

    public function updateStatus(Booking $booking, string $newStatus)
    {
        $currentStatus = $booking->status;

        $allowedTransitions = [
            Booking::STATUS_PENDING_PAYMENT => [
                Booking::STATUS_PAID,
                Booking::STATUS_CANCELLED,
            ],
            Booking::STATUS_PAID => [
                Booking::STATUS_DONE,
                Booking::STATUS_CANCELLED,
                Booking::STATUS_NO_SHOW,
            ],
            Booking::STATUS_DONE => [],
            Booking::STATUS_CANCELLED => [],
            Booking::STATUS_NO_SHOW => [],
        ];

        // Status tidak dikenal
        if (!array_key_exists($currentStatus, $allowedTransitions)) {
            abort(400, 'Invalid current booking status');
        }

        // Cek apakah transisi diizinkan
        if (!in_array($newStatus, $allowedTransitions[$currentStatus])) {
            abort(400, 'Invalid booking status transition');
        }

        // VALIDASI STATUS DONE
        $now = Carbon::now('Asia/Jakarta');

        if ($newStatus === Booking::STATUS_DONE) {
            $bookingEndTime = Carbon::parse(
                $booking->booking_date . ' ' . $booking->end_time,
                'Asia/Jakarta'
            );

            if ($now->lt($bookingEndTime)) {
                abort(400, 'Cannot mark as done before booking finished');
            }
        }

        $booking->update([
            'status' => $newStatus
        ]);

        return $booking;
    }

    public function getAvailableSlots(array $data)
    {
        $service = Service::findOrFail($data['service_id']);
        $barber  = Barber::findOrFail($data['barber_id']);

        // VALIDASI SERVICE & BARBER HARUS SATU BARBERSHOP
        if ($service->barbershop_id !== $barber->barbershop_id) {
            abort(403, 'Invalid barber for this service');
        }

        $bookingDate = Carbon::createFromFormat('Y-m-d', $data['booking_date'], 'Asia/Jakarta');

        $now = Carbon::now('Asia/Jakarta');
        $today = $now->copy()->startOfDay();

        if ($bookingDate->lt($today)) {
            return [];
        }

        // Ambil jam operasional Barbershop
        $dayOfWeek = $bookingDate->dayOfWeek;

        // AAmbil shift barber yang dipilih di hari itu
        $assignment = BarberShiftAssignment::where('barber_id', $barber->id)
            ->where('day_of_week', $dayOfWeek)
            ->first();

        // barber tidak kerja hari itu
        if (!$assignment) {
            return []; 
        }

        $shift = Shift::where('id', $assignment->shift_id)
            ->where('status', 'active')
            ->where('barbershop_id', $barber->barbershop_id)
            ->first();

        // shift tidak aktif
        if (!$shift) {
            return []; 
        }

        // Jam shift barber
        $shiftStart = Carbon::createFromFormat(
            'Y-m-d H:i:s',
            $bookingDate->format('Y-m-d') . ' ' . $shift->start_time,
            'Asia/Jakarta'
        );

        $shiftEnd = Carbon::createFromFormat(
            'Y-m-d H:i:s',
            $bookingDate->format('Y-m-d') . ' ' . $shift->end_time,
            'Asia/Jakarta'
        );

        $operationalHour = OperationalHour::where('barbershop_id', $barber->barbershop_id)
            ->where('day_of_week', $dayOfWeek)
            ->first();

        if (!$operationalHour || $operationalHour->is_closed) {
            return [];
        }

        $openTime = Carbon::createFromFormat(
            'Y-m-d H:i:s',
            $bookingDate->format('Y-m-d') . ' ' . $operationalHour->open_time,
            'Asia/Jakarta'
        );

        $closeTime = Carbon::createFromFormat(
            'Y-m-d H:i:s',
            $bookingDate->format('Y-m-d') . ' ' . $operationalHour->close_time,
            'Asia/Jakarta'
        );

        $finalStart = $shiftStart->greaterThan($openTime) ? $shiftStart : $openTime;
        $finalEnd   = $shiftEnd->lessThan($closeTime) ? $shiftEnd : $closeTime;

        $duration = $service->duration_minutes;

        // Ambil semua booking aktif barber di hari itu
        $existingBookings = Booking::where('barber_id', $barber->id)
            ->whereDate('booking_date', $bookingDate->format('Y-m-d'))
            ->whereIn('status', [
                Booking::STATUS_PENDING_PAYMENT,
                Booking::STATUS_PAID,
                Booking::STATUS_DONE
            ])
            ->select('start_time', 'end_time')
            ->get();

        $slots = [];
        $current = $finalStart->copy();

        while ($current->lt($finalEnd)) {

            $slotStart = $current->copy();
            $slotEnd   = $current->copy()->addMinutes($duration);

            // Jika slot melebihi jam tutup → stop
            if ($slotEnd->gt($finalEnd)) {
                break;
            }

            $isAvailable = true;

            // Cek bentrok dengan booking existing
            foreach ($existingBookings as $booking) {
                
                $bookingStart = Carbon::createFromFormat(
                    'Y-m-d H:i:s',
                    $bookingDate->format('Y-m-d') . ' ' . $booking->start_time,
                    'Asia/Jakarta'
                );

                $bookingEnd = Carbon::createFromFormat(
                    'Y-m-d H:i:s',
                    $bookingDate->format('Y-m-d') . ' ' . $booking->end_time,
                    'Asia/Jakarta'
                );

                if (
                    $slotStart->lt($bookingEnd) &&
                    $slotEnd->gt($bookingStart)
                ) {
                    $isAvailable = false;
                    break;
                }
            }

            // Cegah slot masa lalu (jika hari ini)
            if ($bookingDate->isSameDay($today)) {
                if ($slotStart->lt($now)) {
                    $isAvailable = false;
                }
            }

            $slots[] = [
                'time' => $slotStart->format('H:i'),
                'available' => $isAvailable
            ];

            // FIXED INTERVAL 30 MENIT (sesuai keputusan final)
            $current->addMinutes(30);
        }

        return $slots;
    }

    public function getCustomerBookings(string $filter = null)
    {
        $customer = Auth::user();

        $query = Booking::with(['service', 'barber', 'customer'])
            ->where('customer_id', $customer->id);

        $now = Carbon::now('Asia/Jakarta');

        if ($filter === 'upcoming') {
            $query->where(function ($q) use ($now) {
                $q->whereDate('booking_date', '>', $now->toDateString())
                ->orWhere(function ($qq) use ($now) {
                    $qq->whereDate('booking_date', $now->toDateString())
                        ->where('start_time', '>=', $now->format('H:i:s'));
                });
            });
        }

        if ($filter === 'history') {
            $query->where(function ($q) use ($now) {
                $q->whereDate('booking_date', '<', $now->toDateString())
                ->orWhere(function ($qq) use ($now) {
                    $qq->whereDate('booking_date', $now->toDateString())
                        ->where('start_time', '<', $now->format('H:i:s'));
                });
            });
        }

        return $query
            ->orderBy('booking_date', 'desc')
            ->orderBy('start_time', 'desc')
            ->get();
    }

    public function getOwnerBookings(array $filters = [])
    {
        $owner = Auth::user();

        $barbershopId = $owner->barbershop_id;

        if (!$barbershopId) {
            abort(403, 'Owner does not have barbershop');
        }

        $query = Booking::with(['customer', 'service', 'barber'])
            ->where('barbershop_id', $barbershopId);

        // Filter by date
        if (!empty($filters['date'])) {
            $query->whereDate('booking_date', $filters['date']);                     
        }

        // Filter by barber
        if (!empty($filters['barber_id'])) {
            $query->where('barber_id', $filters['barber_id']);
        }

        // Filter by status
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query
            ->orderBy('booking_date', 'desc')
            ->orderBy('start_time', 'desc')
            ->get();
    }

    public function cancelByCustomer(Booking $booking)
    {
        $customer = Auth::user();

        // Pastikan booking milik customer ini
        if ($booking->customer_id !== $customer->id) {
            abort(403, 'Unauthorized');
        }

        // Status yang boleh dicancel
        $allowedStatuses = [
            Booking::STATUS_PENDING_PAYMENT,
            Booking::STATUS_PAID,
        ];

        if (!in_array($booking->status, $allowedStatuses)) {
            abort(400, 'Booking cannot be cancelled');
        }

        $now = Carbon::now('Asia/Jakarta');
        $bookingDate = Carbon::parse($booking->booking_date, 'Asia/Jakarta')->startOfDay();

        // H-1 Rule (tidak boleh cancel di hari yang sama)
        if ($bookingDate->lte($now->copy()->startOfDay())) {
            abort(400, 'Cannot cancel booking on the same day');
        }

        $booking->update([
            'status' => Booking::STATUS_CANCELLED
        ]);

        return $booking;
    }


}
