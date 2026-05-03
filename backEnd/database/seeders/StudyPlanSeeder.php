<?php

namespace Database\Seeders;

use App\Models\Program;
use App\Models\Specialization;
use App\Models\StudyPlan;
use App\Models\StudyYear;
use Illuminate\Database\Seeder;

class StudyPlanSeeder extends Seeder
{
    public function run(): void
    {
        $bachelor = Program::where('level', 'bachelor')->first();

        if (!$bachelor) {
            return;
        }

        $studyYears = StudyYear::where('program_id', $bachelor->id)
            ->orderBy('year_number')
            ->get();

        $specializations = Specialization::where('program_id', $bachelor->id)->get();

        foreach ($studyYears as $studyYear) {
            foreach ([1, 2] as $semester) {
                if ($studyYear->year_number <= 3) {
                    StudyPlan::updateOrCreate(
                        [
                            'program_id' => $bachelor->id,
                            'specialization_id' => null,
                            'study_year_id' => $studyYear->id,
                            'semester_number' => $semester,
                        ],
                        [
                            'name' => "Bachelor Year {$studyYear->year_number} - Semester {$semester}",
                            'is_active' => true,
                            'notes' => 'General study plan before specialization',
                        ]
                    );
                } else {
                    foreach ($specializations as $specialization) {
                        StudyPlan::updateOrCreate(
                            [
                                'program_id' => $bachelor->id,
                                'specialization_id' => $specialization->id,
                                'study_year_id' => $studyYear->id,
                                'semester_number' => $semester,
                            ],
                            [
                                'name' => "{$specialization->name} - Year {$studyYear->year_number} - Semester {$semester}",
                                'is_active' => true,
                                'notes' => 'Specialization-specific study plan',
                            ]
                        );
                    }
                }
            }
        }
    }
}