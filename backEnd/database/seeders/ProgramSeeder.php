<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Program;
use App\Models\StudyYear;
use App\Models\Specialization;

class ProgramSeeder extends Seeder
{
    public function run(): void
    {

        $bachelor = Program::create([
            'name' => 'Bachelor of Business Administration',
            'level' => 'bachelor',
            'total_years' => 5
        ]);

        Program::create([
            'name' => 'Master',
            'level' => 'master',
            'total_years' => 2
        ]);

        Program::create([
            'name' => 'PhD',
            'level' => 'phd',
            'total_years' => 3
        ]);

        for ($i = 1; $i <= 5; $i++) {

            StudyYear::create([
                'program_id' => $bachelor->id,
                'year_number' => $i,
                'name' => "Year $i"
            ]);
        }

        $specializations = [
            'Operations & MIS',
            'Finance',
            'HR',
            'Marketing'
        ];

        foreach ($specializations as $spec) {

            Specialization::create([
                'program_id' => $bachelor->id,
                'name' => $spec
            ]);
        }
    }
}
