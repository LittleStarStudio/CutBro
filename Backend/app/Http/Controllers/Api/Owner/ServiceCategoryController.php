<?php

namespace App\Http\Controllers\Api\Owner;

use App\Http\Controllers\Api\BaseController;
use App\Models\ServiceCategory;
use Illuminate\Http\Request;
use App\Services\ServiceCategoryService;

class ServiceCategoryController extends BaseController
{
    protected $service;

    public function __construct(ServiceCategoryService $service)
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
            'is_active' => 'sometimes|boolean',   
        ]);

        $category = $this->service->create($data);

        return $this->success($category);
    }

    public function update(Request $request, ServiceCategory $serviceCategory)
    {
        $owner = auth()->user();

        if ($serviceCategory->barbershop_id !== $owner->barbershop_id) {
            abort(403, 'Unauthorized access to this category');
        }

        $data = $request->validate([
            'name' => 'sometimes|string|max:255',
            'is_active' => 'sometimes|boolean'
        ]);

        return $this->success(
            $this->service->update($serviceCategory, $data)
        );
    }

    public function destroy(ServiceCategory $serviceCategory)
    {
        $owner = auth()->user();

        if ($serviceCategory->barbershop_id !== $owner->barbershop_id) {
            abort(403, 'Unauthorized access to this category');
        }

        // Guard 1: tidak bisa hapus jika category masih Active
        if ($serviceCategory->is_active) {
            return $this->error(
                'Cannot delete an active category. Please set the category to Inactive first.',
                422
            );
        }

        // Guard 2: tidak bisa hapus jika masih ada services
        if ($serviceCategory->services()->exists()) {
            return $this->error(
                'Cannot delete category that still has services. Please move or delete all services in this category first.',
                422
            );
        }

        $this->service->delete($serviceCategory);

        return $this->success(null, 'Category deleted');
    }

}
