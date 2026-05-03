<?php

namespace Database\Seeders;

use App\Models\AcademicYear;
use Illuminate\Database\Seeder;

class AcademicYearSeeder extends Seeder
{
    public function run(): void
    {
        AcademicYear::updateOrCreate(
            ['name' => '2025-2026'],
            [
                'is_current' => true,
                'start_date' => '2025-09-01',
                'end_date' => '2026-08-31',
            ]
        );
    }
}