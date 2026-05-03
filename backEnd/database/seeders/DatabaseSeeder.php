<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            DepartmentSeeder::class,
            RoleAndPermissionSeeder::class,
            SuperAdminSeeder::class,
            ProgramSeeder::class,
            AcademicYearSeeder::class,
            StudyPlanSeeder::class,
        ]);
    }
}