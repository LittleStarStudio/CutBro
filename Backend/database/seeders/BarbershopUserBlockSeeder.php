<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\BarbershopUserBlock;
use App\Models\User;
use App\Models\Barbershop;

class BarbershopUserBlockSeeder extends Seeder
{
    public function run(): void
    {
        $shop = Barbershop::first();
        $customer = User::whereHas('role', fn($q) => $q->where('name','customer'))->first();

        BarbershopUserBlock::updateOrCreate(
            [
                'barbershop_id' => $shop->id,
                'user_id' => $customer->id
            ],
            [
                'reason' => 'Frequent no show'
            ]
        );
    }
}