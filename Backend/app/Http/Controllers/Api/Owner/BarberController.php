<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Api\BaseController;
use App\Models\Barber;
use Illuminate\Http\Request;
use App\Services\BarberService;

class BarberController extends BaseController
{
    protected $service;

    public function __construct(BarberService $service)
    {
        $this->service = $service;
    }

    public function index()
    {
        return $this->success(
            $this->service->getAll()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'bio' => 'nullable|string',
            'photo_url' => 'nullable|string',
        ]);

        return $this->success(
            $this->service->create($data, auth()->user())
        );
    }

    public function update(Request $request, Barber $barber)
    {
        $owner = auth()->user();

        if ($barber->barbershop_id !== $owner->barbershop_id) {
            abort(403, 'Unauthorized access to this barber');
        }

        $data = $request->validate([
            'bio' => 'nullable|string',
            'photo_url' => 'nullable|string',
            'status' => 'sometimes|in:available,off'
        ]);

        return $this->success(
            $this->service->update($barber, $data)
        );
    }

    public function destroy(Barber $barber)
    {
        $owner = auth()->user();

        if ($barber->barbershop_id !== $owner->barbershop_id) {
            abort(403, 'Unauthorized access to this barber');
        }

        $this->service->delete($barber);

        return $this->success([
            'message' => 'Barber deleted'
        ]);
    }
}
