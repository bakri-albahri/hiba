<?php

namespace App\Services;

use App\Models\Student;
use App\Models\StudentAcademicRecord;
use App\Models\StudentCourseEnrollment;
use App\Models\StudyPlan;
use Illuminate\Support\Collection;
use InvalidArgumentException;

class StudentAutoEnrollmentService
{
    public function autoEnroll(Student $student, int $academicYearId, int $studyYearId, ?string $notes = null): array
    {
        $student->loadMissing(['program', 'specialization']);

        $academicRecord = StudentAcademicRecord::where('student_id', $student->id)
            ->where('academic_year_id', $academicYearId)
            ->where('study_year_id', $studyYearId)
            ->first();

        if (!$academicRecord) {
            throw new InvalidArgumentException('Student does not have an academic record for the selected academic year and study year.');
        }

        $studyPlans = $this->getMatchingStudyPlans($student, $studyYearId);

        if ($studyPlans->isEmpty()) {
            throw new InvalidArgumentException('No active study plans found for this student program, specialization, and study year.');
        }

        $createdCount = 0;
        $existingCount = 0;
        $createdEnrollmentIds = [];
        $existingEnrollmentIds = [];

        foreach ($studyPlans as $studyPlan) {
            foreach ($studyPlan->courses as $course) {
                $enrollment = StudentCourseEnrollment::firstOrCreate(
                    [
                        'student_id' => $student->id,
                        'course_id' => $course->id,
                        'academic_year_id' => $academicYearId,
                    ],
                    [
                        'study_year_id' => $studyYearId,
                        'semester_number' => $studyPlan->semester_number,
                        'is_carried' => false,
                        'is_supplementary' => false,
                        'status' => 'enrolled',
                        'notes' => $notes ?: 'Auto-enrolled from study plan.',
                    ]
                );

                if ($enrollment->wasRecentlyCreated) {
                    $createdCount++;
                    $createdEnrollmentIds[] = $enrollment->id;
                } else {
                    $existingCount++;
                    $existingEnrollmentIds[] = $enrollment->id;
                }
            }
        }

        return [
            'created_enrollments_count' => $createdCount,
            'existing_enrollments_count' => $existingCount,
            'total_matched_study_plans' => $studyPlans->count(),
            'created_enrollment_ids' => $createdEnrollmentIds,
            'existing_enrollment_ids' => $existingEnrollmentIds,
        ];
    }

    private function getMatchingStudyPlans(Student $student, int $studyYearId): Collection
    {
        $query = StudyPlan::with('courses')
            ->where('program_id', $student->program_id)
            ->where('study_year_id', $studyYearId)
            ->where('is_active', true);

        if ($student->specialization_id) {
            $query->where(function ($q) use ($student) {
                $q->where('specialization_id', $student->specialization_id)
                    ->orWhereNull('specialization_id');
            });
        } else {
            $query->whereNull('specialization_id');
        }

        return $query
            ->orderBy('semester_number')
            ->get()
            ->filter(fn ($studyPlan) => $studyPlan->courses->isNotEmpty())
            ->values();
    }
}
