<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Service;
use App\Models\ServiceCategory;

class ServiceSeeder extends Seeder
{
    public function run(): void
    {
        foreach (ServiceCategory::all() as $category) {

            Service::updateOrCreate(
                [
                    'category_id' => $category->id,
                    'name' => 'Basic'
                ],
                [
                    'category_id' => $category->id,
                    'price' => 50000,
                    'duration_minutes' => 30,
                    'is_active' => true
                ]
            );

            Service::updateOrCreate(
                [
                    'category_id' => $category->id,
                    'name' => 'Premium' 
                ],
                [
                    'category_id' => $category->id,
                    'price' => 80000,
                    'duration_minutes' => 60,
                    'is_active' => true
                ]
            );
        }
    }
}