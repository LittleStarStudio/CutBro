<?php

namespace App\Services;

use App\Models\Service;
use App\Models\ServiceCategory;

class ServiceService
{
    public function getAll()
    {
        return Service::with('category')->latest()->get();
    }

    public function create(array $data)
    {
        ServiceCategory::findOrFail($data['category_id']);

        return Service::create($data);
    }

    public function update(Service $service, array $data)
    {
        if (isset($data['category_id'])) {
            ServiceCategory::findOrFail($data['category_id']);
        }

        $service->update($data);
        return $service->fresh()->load('category');
    }

    public function delete(Service $service)
    {
        $service->delete();
    }
}