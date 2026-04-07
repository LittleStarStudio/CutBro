<?php

namespace Database\Seeders;

use App\Models\SubscriptionPlan;
use Illuminate\Database\Seeder;

class SubscriptionPlanSeeder extends Seeder
{
    public function run(): void
    {
        $plans = [
            [
                'name'         => 'free',
                'display_name' => 'Free',
                'price'        => 0,
                'description'  => 'Perfect for small barbershops just getting started',
                'max_barbers'  => 1,
            ],
            [
                'name'         => 'pro',
                'display_name' => 'Pro',
                'price'        => 299000,
                'description'  => 'For growing barbershops that need more power',
                'max_barbers'  => 5,
            ],
            [
                'name'         => 'premium',
                'display_name' => 'Premium',
                'price'        => 599000,
                'description'  => 'For large barbershops & franchises',
                'max_barbers'  => null,
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::firstOrCreate(['name' => $plan['name']], $plan);
        }
    }
}