<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Role;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            'super_admin',
            'owner',
            'barber',
            'customer'
        ] as $role) {
            Role::firstOrCreate(['name' => $role]);
        }
        
    }
}