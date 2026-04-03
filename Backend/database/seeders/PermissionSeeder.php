<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\Permission;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        // Create permissions
        foreach ([
            'manage_barbershop',
            'manage_barber',
            'manage_service',
            'manage_booking',
            'create_booking',
            'view_booking'
        ] as $perm) {
            Permission::firstOrCreate(['name' => $perm]);
        }

        // Ambil role
        $owner = Role::where('name', 'owner')->first();
        $barber = Role::where('name', 'barber')->first();
        $customer = Role::where('name', 'customer')->first();

        // Assign permissions ke owner
        $owner->permissions()->syncWithoutDetaching([
            Permission::where('name','manage_barbershop')->first()->id,
            Permission::where('name','manage_barber')->first()->id,
            Permission::where('name','manage_service')->first()->id,
            Permission::where('name','manage_booking')->first()->id,
        ]);

        // Barber permissions
        $barber->permissions()->syncWithoutDetaching([
            Permission::where('name','manage_booking')->first()->id,
        ]);

        // Customer permissions
        $customer->permissions()->syncWithoutDetaching([
            Permission::where('name','create_booking')->first()->id,
            Permission::where('name','view_booking')->first()->id,
        ]);
        
    }

}
