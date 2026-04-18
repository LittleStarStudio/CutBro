<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            PermissionSeeder::class,
            UserSeeder::class,

            ServiceCategorySeeder::class,
            ServiceSeeder::class,

            OperationalHourSeeder::class,
            // ShiftSeeder::class,                    
            // BarberShiftAssignmentSeeder::class,    

            BookingSeeder::class,
            BarbershopUserBlockSeeder::class,
            RefundRequestSeeder::class,

            SubscriptionPlanSeeder::class,
        ]);
        
    }
}
