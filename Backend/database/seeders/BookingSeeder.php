<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Booking;
use App\Models\User;
use App\Models\Service;
use App\Models\Barber;
use App\Models\BarberShiftAssignment;
use App\Models\Shift;
use Carbon\Carbon;

class BookingSeeder extends Seeder
{
    public function run(): void
    {
        $customers = User::whereHas('role', fn($q) => $q->where('name', 'customer'))
            ->take(20)
            ->get();

        $barbers = Barber::all();

        foreach ($barbers as $barber) {

            $service = Service::where('barbershop_id', $barber->barbershop_id)->first();

            if (!$service) {
                continue;
            }

            // Booking masa lalu (history test)
            $this->generateSlots($barber, $service, $customers, -2, Booking::STATUS_DONE);

            // Booking hari ini (cancel rule test)
            $this->generateSlots($barber, $service, $customers, 0, Booking::STATUS_PAID);

            // Booking masa depan (upcoming test)
            $this->generateSlots($barber, $service, $customers, 2, Booking::STATUS_PENDING_PAYMENT);

            // Booking masa depan lain (state flow test)
            $this->generateSlots($barber, $service, $customers, 3, Booking::STATUS_PAID);

            // Edge Case: slot hampir bertabrakan
            $date = Carbon::now('Asia/Jakarta')->addDays(4)->toDateString();

            $dayOfWeek = Carbon::parse($date, 'Asia/Jakarta')->dayOfWeek;

            $assignment = BarberShiftAssignment::where('barber_id', $barber->id)
                ->where('day_of_week', $dayOfWeek)
                ->first();

            if ($assignment) {
                $shift = Shift::find($assignment->shift_id);

                if ($shift) {

                    $start = Carbon::createFromFormat(
                        'Y-m-d H:i:s',
                        $date . ' ' . $shift->start_time,
                        'Asia/Jakarta'
                    );

                    $end = $start->copy()->addMinutes($service->duration_minutes);

                    Booking::create([
                        'barbershop_id' => $barber->barbershop_id,
                        'customer_id' => $customers->random()->id,
                        'barber_id' => $barber->id,
                        'service_id' => $service->id,
                        'booking_date' => $date,
                        'start_time' => $start->format('H:i:s'),
                        'end_time' => $end->format('H:i:s'),
                        'total_price' => $service->price,
                        'status' => Booking::STATUS_PAID
                    ]);
                }
            }

        }
    }

    private function generateSlots($barber, $service, $customers, $dayOffset, $status)
    {
        $date = Carbon::now('Asia/Jakarta')
            ->addDays($dayOffset)
            ->toDateString();

        $dayOfWeek = Carbon::parse($date, 'Asia/Jakarta')->dayOfWeek;

        $assignment = BarberShiftAssignment::where('barber_id', $barber->id)
            ->where('day_of_week', $dayOfWeek)
            ->first();

        if (!$assignment) {
            return;
        }

        $shift = Shift::find($assignment->shift_id);
        if (!$shift) {
            return;
        }

        $slot = Carbon::createFromFormat(
            'H:i:s',
            $shift->start_time,
            'Asia/Jakarta'
        );

        $shiftEnd = Carbon::createFromFormat(
            'H:i:s',
            $shift->end_time,
            'Asia/Jakarta'
        );

        for ($i = 0; $i < 4; $i++) {

            $start = $slot->copy();
            $end = $start->copy()->addMinutes($service->duration_minutes);

            if ($end->gt($shiftEnd)) {
                break;
            }

            Booking::create([
                'barbershop_id' => $barber->barbershop_id,
                'customer_id' => $customers->random()->id,
                'barber_id' => $barber->id,
                'service_id' => $service->id,
                'booking_date' => $date,
                'start_time' => $start->format('H:i:s'),
                'end_time' => $end->format('H:i:s'),
                'total_price' => $service->price,
                'status' => $status
            ]);

            $slot->addMinutes(30);
        }
    }
}