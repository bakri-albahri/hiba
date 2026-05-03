<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $user = User::updateOrCreate(
            ['email' => 'admin@university.com'],
            [
                'full_name' => 'Super Admin',
                'father_name' => 'System',
                'mother_name' => 'Administrator',
                'birth_date' => '1990-01-01',
                'birth_place' => 'Damascus',
                'central_registry' => 'Default',
                'national_id' => 'SUPERADMIN001',
                'nationality' => 'Syrian',
                'gender' => 'male',
                'mobile' => '0999999999',
                'address' => 'Main Administration',
                'password' => '12345678',
                'type' => 'super_admin',
            ]
        );

        if (!$user->hasRole('super_admin')) {
            $user->assignRole('super_admin');
        }
    }
}