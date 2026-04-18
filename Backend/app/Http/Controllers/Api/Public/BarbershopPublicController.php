<?php

namespace App\Http\Controllers\Api\Public;

use App\Http\Controllers\Api\BaseController;
use App\Models\Barbershop;
use App\Models\BarbershopUserBlock;   
use App\Services\BookingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;   

class BarbershopPublicController extends BaseController
{
    public function __construct(protected BookingService $bookingService) {}

    // GET /barbershops
    public function index(Request $request)
    {
        $query = Barbershop::where('status', 'active');

        if ($request->filled('search')) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('city', 'like', '%' . $request->search . '%')
                  ->orWhere('address', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->filled('city')) {
            $query->where('city', $request->city);
        }

        $shops = $query->with([
            'operationalHours',
            'services' => fn($q) => $q->where('is_active', true),
            'photos'   => fn($q) => $q->orderBy('order')->limit(1),
        ])->latest()->get(['id','name','slug','description','logo_url','address','city','phone','status']);

        $now        = \Carbon\Carbon::now('Asia/Jakarta');
        $dayOfWeek  = $now->dayOfWeek;
        $currentTime = $now->format('H:i:s');

        return $this->success($shops->map(function ($s) use ($dayOfWeek, $currentTime) {
            $oh = $s->operationalHours->firstWhere('day_of_week', $dayOfWeek);
            $isOpenNow = $oh && !$oh->is_closed
                && $oh->open_time && $oh->close_time
                && $currentTime >= $oh->open_time
                && $currentTime <= $oh->close_time;

            $minPrice = $s->services->min('price');

            $avg = \Illuminate\Support\Facades\DB::table('barbershop_ratings')
                ->where('barbershop_id', $s->id)
                ->avg('rating');

            return [
                'id'             => $s->id,
                'name'           => $s->name,
                'slug'           => $s->slug,
                'description'    => $s->description,
                'logo_url'       => $s->logo_url,
                'address'        => $s->address,
                'city'           => $s->city,
                'phone'          => $s->phone,
                'status'         => $s->status,
                'is_open_now'    => $isOpenNow,
                'min_price'      => $minPrice,
                'average_rating'  => $avg ? round((float) $avg, 1) : null,
                'cover_photo_url' => $s->photos->first()
                    ? Storage::disk('public')->url($s->photos->first()->photo_url)
                    : null,
            ];
        }));

    }

    // GET /barbershops/{id}
    public function show(int $id)
    {
        $b = Barbershop::with([
            'services' => fn($q) => $q->where('is_active', true)->with(['category', 'activePromo']),
            'barbers' => fn($q) => $q->where('status', 'available')->with('user'),
            'operationalHours',
        ])->where('status', 'active')->findOrFail($id);

        if (auth()->check()) {
            $isBlocked = BarbershopUserBlock::where('barbershop_id', $id)
                ->where('user_id', auth()->id())
                ->whereNull('deleted_at')
                ->exists();
            if ($isBlocked) {
                return $this->error('You are blocked from this barbershop.', 403);
            }
        }

        return $this->success([
            'id'                => $b->id,
            'name'              => $b->name,
            'description'       => $b->description,
            'logo_url'          => $b->logo_url,
            'address'           => $b->address,
            'city'              => $b->city,
            'phone'             => $b->phone,
            'average_rating'    => round($b->ratings()->avg('rating') ?? 0, 1),
            'total_ratings'     => $b->ratings()->count(),
            'operational_hours' => $b->operationalHours,
            'services'          => $b->services->map(fn($s) => [
                'id'               => $s->id,
                'name'             => $s->name,
                'description'      => $s->description,
                'price'            => $s->price,
                'duration_minutes' => $s->duration_minutes,
                'category'         => $s->category?->name,
                'promo'            => $s->activePromo ? [          
                    'discount_percent' => $s->activePromo->discount_percent,
                    'final_price'      => $s->activePromo->final_price,
                ] : null,
            ]),
            'barbers' => $b->barbers->map(fn($br) => [
                'id'        => $br->id,
                'name'      => $br->user?->name ?? 'Unknown',
                'bio'       => $br->bio,
                'photo_url' => $br->photo_url,
            ]),
        ]);
    }

    // GET /barbershops/{id}/available-slots
    public function availableSlots(Request $request)
    {
        $data = $request->validate([
            'service_id'   => 'required|exists:services,id',
            'barber_id'    => 'required|exists:barbers,id',
            'booking_date' => 'required|date_format:Y-m-d',
        ]);

        return $this->success($this->bookingService->getAvailableSlots($data));
    }
}
