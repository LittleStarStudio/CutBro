<?php

namespace App\Services;

use App\Models\ServiceCategory;

class ServiceCategoryService
{
    public function getAll()
    {
        return ServiceCategory::latest()->get();
    }

    public function create(array $data)
    {
        return ServiceCategory::create($data);
    }

    public function update(ServiceCategory $category, array $data)
    {
        $category->update($data);
        return $category->fresh();
    }

    public function delete(ServiceCategory $category)
    {
        $category->delete();
    }
}
