<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ServiceCategory;
use App\Models\Barbershop;

class ServiceCategorySeeder extends Seeder
{
    public function run(): void
    {
        foreach (Barbershop::all() as $shop) {

            ServiceCategory::updateOrCreate(
                ['barbershop_id' => $shop->id, 'name' => 'Haircut'],
                ['is_active' => true]
            );

            ServiceCategory::updateOrCreate(
                ['barbershop_id' => $shop->id, 'name' => 'Shaving'],
                ['is_active' => true]
            );

            ServiceCategory::updateOrCreate(
                ['barbershop_id' => $shop->id, 'name' => 'Coloring'],
                ['is_active' => true]
            );
        }
    }
}