<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Api\BaseController;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Services\ServiceService;

class ServiceController extends BaseController
{
    protected $serviceService;

    public function __construct(ServiceService $serviceService)
    {
        $this->serviceService = $serviceService;
    }

    public function index()
    {
        return $this->success(
            $this->serviceService->getAll()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'category_id' => [
                'required',
                Rule::exists('service_categories', 'id')
                    ->where(fn ($q) => $q->where('barbershop_id', auth()->user()->barbershop_id))
            ],

            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric',
            'duration_minutes' => 'required|integer',
        ]);

        $service = $this->serviceService->create($data);

        return $this->success($service);
    }

    public function update(Request $request, Service $service)
    {
        $owner = auth()->user();

        if ($service->barbershop_id !== $owner->barbershop_id) {
            abort(403, 'Unauthorized access to this service');
        }

        $data = $request->validate([
            'category_id' => [
                'sometimes',
                Rule::exists('service_categories', 'id')
                    ->where(fn ($q) => $q->where('barbershop_id', auth()->user()->barbershop_id))
            ],
            
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'price' => 'sometimes|numeric',
            'duration_minutes' => 'sometimes|integer',
            'is_active' => 'sometimes|boolean'
        ]);

        return $this->success(
            $this->serviceService->update($service, $data)
        );
    }

    public function destroy(Service $service)
    {
        $owner = auth()->user();

        if ($service->barbershop_id !== $owner->barbershop_id) {
            abort(403, 'Unauthorized access to this service');
        }

        $this->serviceService->delete($service);

        return $this->success(null, 'Service deleted');
    }

}
