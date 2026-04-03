<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Role;
use App\Models\Barbershop;
use App\Models\Barber;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Ambil role
        $superAdminRole = Role::where('name', 'super_admin')->first();
        $ownerRole      = Role::where('name', 'owner')->first();
        $barberRole     = Role::where('name', 'barber')->first();
        $customerRole   = Role::where('name', 'customer')->first();

        if (!$superAdminRole || !$ownerRole || !$barberRole || !$customerRole) {
            $this->command->error('Roles belum ada. Jalankan RoleSeeder dulu.');
            return;
        }

        /*
        |---------------------------------------
        | SUPER ADMIN
        |---------------------------------------
        */
        User::updateOrCreate(
            ['email' => 'studiolittlestar2@gmail.com'],
            [
                'name' => 'Super Admin',
                'password' => Hash::make('Password'),
                'role_id' => $superAdminRole->id,
                'barbershop_id' => null,
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        /*
        |---------------------------------------
        | OWNER 1 + BARBERSHOP
        |---------------------------------------
        */
        $shop1 = Barbershop::updateOrCreate(
            ['slug' => 'little-star-barbershop'],
            [
                'name' => 'Little Star Barbershop',
                'address' => 'Demo Address',
                'city' => 'Yogyakarta',
                'phone' => '08123456789',
                'status' => 'active'
            ]
        );

        $owner1 = User::updateOrCreate(
            ['email' => 'owner1@demo.com'],
            [
                'name' => 'Owner Demo 1',
                'password' => Hash::make('Password'),
                'role_id' => $ownerRole->id,
                'barbershop_id' => $shop1->id,
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        // Barber 1A
        $barberUser1A = User::updateOrCreate(
            ['email' => 'andi@demo.com'],
            [
                'name' => 'Andi',
                'password' => Hash::make('Password'),
                'role_id' => $barberRole->id,
                'barbershop_id' => $shop1->id,
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        Barber::updateOrCreate(
            ['user_id' => $barberUser1A->id],
            [
                'barbershop_id' => $shop1->id,
                'created_by_owner_id' => $owner1->id,
                'bio' => 'Senior barber',
                'status' => 'available'
            ]
        );

        // Barber 1B
        $barberUser1B = User::updateOrCreate(
            ['email' => 'budi@demo.com'],
            [
                'name' => 'Budi',
                'password' => Hash::make('Password'),
                'role_id' => $barberRole->id,
                'barbershop_id' => $shop1->id,
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        Barber::updateOrCreate(
            ['user_id' => $barberUser1B->id],
            [
                'barbershop_id' => $shop1->id,
                'created_by_owner_id' => $owner1->id,
                'bio' => 'Barber specialist fade',
                'status' => 'available'
            ]
        );

        /*
        |---------------------------------------
        | OWNER 2
        |---------------------------------------
        */
        $shop2 = Barbershop::updateOrCreate(
            ['slug' => 'king-barber'],
            [
                'name' => 'King Barber',
                'address' => 'Jl. Malioboro',
                'city' => 'Yogyakarta',
                'phone' => '0811111111',
                'status' => 'active'
            ]
        );

        $owner2 = User::updateOrCreate(
            ['email' => 'owner2@demo.com'],
            [
                'name' => 'Owner Demo 2',
                'password' => Hash::make('Password'),
                'role_id' => $ownerRole->id,
                'barbershop_id' => $shop2->id,
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        $barberUser2A = User::updateOrCreate(
            ['email' => 'joko@demo.com'],
            [
                'name' => 'Joko',
                'password' => Hash::make('Password'),
                'role_id' => $barberRole->id,
                'barbershop_id' => $shop2->id,
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        Barber::updateOrCreate(
            ['user_id' => $barberUser2A->id],
            [
                'barbershop_id' => $shop2->id,
                'created_by_owner_id' => $owner2->id,
                'bio' => 'Expert coloring',
                'status' => 'available'
            ]
        );

        $barberUser2B = User::updateOrCreate(
            ['email' => 'rudi@demo.com'],
            [
                'name' => 'Rudi',
                'password' => Hash::make('Password'),
                'role_id' => $barberRole->id,
                'barbershop_id' => $shop2->id,
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        Barber::updateOrCreate(
            ['user_id' => $barberUser2B->id],
            [
                'barbershop_id' => $shop2->id,
                'created_by_owner_id' => $owner2->id,
                'bio' => 'Beard specialist',
                'status' => 'available'
            ]
        );

        /*
        |---------------------------------------
        | OWNER 3
        |---------------------------------------
        */
        $shop3 = Barbershop::updateOrCreate(
            ['slug' => 'sultan-barber'],
            [
                'name' => 'Sultan Barber',
                'address' => 'Jl. Kaliurang',
                'city' => 'Yogyakarta',
                'phone' => '0822222222',
                'status' => 'active'
            ]
        );

        $owner3 = User::updateOrCreate(
            ['email' => 'owner3@demo.com'],
            [
                'name' => 'Owner Demo 3',
                'password' => Hash::make('Password'),
                'role_id' => $ownerRole->id,
                'barbershop_id' => $shop3->id,
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        $barberUser3A = User::updateOrCreate(
            ['email' => 'deni@demo.com'],
            [
                'name' => 'Deni',
                'password' => Hash::make('Password'),
                'role_id' => $barberRole->id,
                'barbershop_id' => $shop3->id,
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        Barber::updateOrCreate(
            ['user_id' => $barberUser3A->id],
            [
                'barbershop_id' => $shop3->id,
                'created_by_owner_id' => $owner3->id,
                'bio' => 'Kids haircut expert',
                'status' => 'available'
            ]
        );

        $barberUser3B = User::updateOrCreate(
            ['email' => 'fajar@demo.com'],
            [
                'name' => 'Fajar',
                'password' => Hash::make('Password'),
                'role_id' => $barberRole->id,
                'barbershop_id' => $shop3->id,
                'status' => 'active',
                'email_verified_at' => now(),
            ]
        );

        Barber::updateOrCreate(
            ['user_id' => $barberUser3B->id],
            [
                'barbershop_id' => $shop3->id,
                'created_by_owner_id' => $owner3->id,
                'bio' => 'Fast cutting specialist',
                'status' => 'available'
            ]
        );

        /*
        |---------------------------------------
        | CUSTOMERS (50)
        |---------------------------------------
        */
        for ($i = 1; $i <= 50; $i++) {
            User::updateOrCreate(
                ['email' => "customer$i@demo.com"],
                [
                    'name' => "Customer $i",
                    'password' => Hash::make('Password'),
                    'role_id' => $customerRole->id,
                    'barbershop_id' => null,
                    'status' => 'active',
                    'email_verified_at' => now(),
                ]
            );
        }
    }
}
