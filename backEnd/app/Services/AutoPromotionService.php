<?php

namespace App\Services;

use App\Models\AcademicYear;
use App\Models\Student;
use App\Models\StudentAcademicRecord;
use App\Models\StudentCourseEnrollment;
use App\Models\StudyPlan;
use App\Models\StudyYear;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Exception;

class AutoPromotionService
{
    public function __construct(
        protected AcademicProgressService $academicProgressService,
        protected NotificationService $notificationService
    ) {
    }

    public function promoteAllStudentsForAcademicYear(int $currentAcademicYearId): array
    {
        $currentAcademicYear = AcademicYear::findOrFail($currentAcademicYearId);
        $nextAcademicYear = $this->getNextAcademicYear($currentAcademicYear);

        if (!$nextAcademicYear) {
            throw new Exception('Next academic year was not found.');
        }

        $students = Student::with([
            'academicRecords' => function ($query) use ($currentAcademicYearId) {
                $query->where('academic_year_id', $currentAcademicYearId);
            },
            'program',
            'specialization',
            'user',
        ])
            ->where('is_active_registration', true)
            ->where('is_exhausted', false)
            ->get();

        $results = [
            'processed_students' => 0,
            'passed_students' => 0,
            'promoted_students' => 0,
            'failed_students' => 0,
            'exhausted_students' => 0,
        ];

        foreach ($students as $student) {
            DB::transaction(function () use (
                $student,
                $currentAcademicYear,
                $nextAcademicYear,
                &$results
            ) {
                $currentRecord = StudentAcademicRecord::where('student_id', $student->id)
                    ->where('academic_year_id', $currentAcademicYear->id)
                    ->first();

                if (!$currentRecord) {
                    return;
                }

                $results['processed_students']++;

                $evaluatedRecord = $this->academicProgressService->evaluateStudentYear(
                    $student->id,
                    $currentAcademicYear->id
                );

                if ($evaluatedRecord->academic_result === 'passed') {
                    $this->assertSpecializationExistsIfEnteringSecondStage($student, $currentRecord);

                    $results['passed_students']++;

                    $this->createNextYearRecordAndEnrollments(
                        $student,
                        $evaluatedRecord,
                        $nextAcademicYear->id,
                        false
                    );

                    $this->notificationService->sendToStudent(
                        $student,
                        'academic_year_result',
                        'Academic Year Passed',
                        'Congratulations. You have successfully passed the academic year and were moved to the next year.',
                        [
                            'academic_year_id' => $currentAcademicYear->id,
                            'next_academic_year_id' => $nextAcademicYear->id,
                            'result' => 'passed',
                        ]
                    );
                } elseif ($evaluatedRecord->academic_result === 'promoted') {
                    $this->assertSpecializationExistsIfEnteringSecondStage($student, $currentRecord);

                    $results['promoted_students']++;

                    $this->createNextYearRecordAndEnrollments(
                        $student,
                        $evaluatedRecord,
                        $nextAcademicYear->id,
                        true
                    );

                    $this->notificationService->sendToStudent(
                        $student,
                        'academic_year_result',
                        'Promoted to Next Academic Year',
                        'You have been promoted to the next academic year with carried courses.',
                        [
                            'academic_year_id' => $currentAcademicYear->id,
                            'next_academic_year_id' => $nextAcademicYear->id,
                            'result' => 'promoted',
                            'carried_courses_count' => $evaluatedRecord->carried_courses_count,
                        ]
                    );
                } elseif ($evaluatedRecord->academic_result === 'failed') {
                    $results['failed_students']++;

                    $this->repeatCurrentStudyYear(
                        $student,
                        $evaluatedRecord,
                        $nextAcademicYear->id
                    );

                    $this->notificationService->sendToStudent(
                        $student,
                        'academic_year_result',
                        'Academic Year Failed',
                        'You did not meet the requirements to progress and will repeat only the failed courses in the same study year.',
                        [
                            'academic_year_id' => $currentAcademicYear->id,
                            'next_academic_year_id' => $nextAcademicYear->id,
                            'result' => 'failed',
                        ]
                    );
                } elseif ($evaluatedRecord->academic_result === 'exhausted') {
                    $results['exhausted_students']++;

                    $this->notificationService->sendToStudent(
                        $student,
                        'academic_year_result',
                        'Registration Exhausted',
                        'Your registration has been exhausted according to the academic regulations.',
                        [
                            'academic_year_id' => $currentAcademicYear->id,
                            'result' => 'exhausted',
                        ]
                    );
                }
            });
        }

        return $results;
    }

    private function createNextYearRecordAndEnrollments(
        Student $student,
        StudentAcademicRecord $currentRecord,
        int $nextAcademicYearId,
        bool $includeCarriedCourses
    ): void {
        $nextStudyYear = $this->getNextStudyYear(
            $student->program_id,
            $currentRecord->study_year_id
        );

        if (!$nextStudyYear) {
            return;
        }

        $nextRecord = StudentAcademicRecord::updateOrCreate(
            [
                'student_id' => $student->id,
                'academic_year_id' => $nextAcademicYearId,
            ],
            [
                'study_year_id' => $nextStudyYear->id,
                'registration_status' => $currentRecord->tuition_paid ? 'registered' : 'not_registered',
                'academic_result' => 'in_progress',
                'annual_average' => null,
                'carried_courses_count' => 0,
                'carried_courses_credit_sum' => 0,
                'tuition_paid' => false,
                'auto_promoted' => true,
                'consecutive_failures_in_same_year' => 0,
                'notes' => 'Created automatically by promotion engine.',
            ]
        );

        $this->enrollStudentInStudyPlans(
            $student,
            $nextAcademicYearId,
            $nextStudyYear->id
        );

        if ($includeCarriedCourses) {
            $carriedEnrollments = $this->academicProgressService->getCarriedEnrollments(
                $student->id,
                $currentRecord->academic_year_id
            );

            foreach ($carriedEnrollments as $carriedEnrollment) {
                $this->createOrResetRetakeEnrollment(
                    $student,
                    $carriedEnrollment->course_id,
                    $nextAcademicYearId,
                    $nextStudyYear->id,
                    (int) $carriedEnrollment->semester_number,
                    true,
                    'Automatically carried from previous academic year.'
                );
            }

            $nextRecord->update([
                'carried_courses_count' => $carriedEnrollments->count(),
                'carried_courses_credit_sum' => $carriedEnrollments->sum(function ($enrollment) {
                    return (int) ($enrollment->course->credit_hours ?? 0);
                }),
            ]);
        }
    }

    private function repeatCurrentStudyYear(
        Student $student,
        StudentAcademicRecord $currentRecord,
        int $nextAcademicYearId
    ): void {
        StudentAcademicRecord::updateOrCreate(
            [
                'student_id' => $student->id,
                'academic_year_id' => $nextAcademicYearId,
            ],
            [
                'study_year_id' => $currentRecord->study_year_id,
                'registration_status' => $currentRecord->tuition_paid ? 'registered' : 'not_registered',
                'academic_result' => 'in_progress',
                'annual_average' => null,
                'carried_courses_count' => 0,
                'carried_courses_credit_sum' => 0,
                'tuition_paid' => false,
                'auto_promoted' => false,
                'consecutive_failures_in_same_year' => $currentRecord->consecutive_failures_in_same_year,
                'notes' => 'Created automatically for repeating failed courses only in the same study year.',
            ]
        );

        $this->enrollFailedCoursesForRepeat(
            $student,
            $currentRecord->academic_year_id,
            $nextAcademicYearId,
            $currentRecord->study_year_id
        );
    }

    private function enrollStudentInStudyPlans(
        Student $student,
        int $academicYearId,
        int $studyYearId
    ): void {
        $studyYear = StudyYear::find($studyYearId);

        if (!$studyYear) {
            return;
        }

        $this->assertSpecializationMatchesStudyStage($student, $studyYear);

        $studyPlansQuery = StudyPlan::with('courses')
            ->where('program_id', $student->program_id)
            ->where('study_year_id', $studyYearId)
            ->where('is_active', true);

        if ($student->specialization_id) {
            $studyPlansQuery->where(function ($query) use ($student) {
                $query->where('specialization_id', $student->specialization_id)
                    ->orWhereNull('specialization_id');
            });
        } else {
            $studyPlansQuery->whereNull('specialization_id');
        }

        $studyPlans = $studyPlansQuery->get();

        foreach ($studyPlans as $studyPlan) {
            foreach ($studyPlan->courses as $course) {
                StudentCourseEnrollment::updateOrCreate(
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
                        'notes' => 'Automatically enrolled from study plan.',
                    ]
                );
            }
        }
    }

    private function enrollFailedCoursesForRepeat(
        Student $student,
        int $currentAcademicYearId,
        int $nextAcademicYearId,
        int $studyYearId
    ): void {
        $previousEnrollments = StudentCourseEnrollment::with(['grade', 'course'])
            ->where('student_id', $student->id)
            ->where('academic_year_id', $currentAcademicYearId)
            ->get();

        $effectiveEnrollments = $this->resolveEffectiveEnrollmentsPerCourse($previousEnrollments);

        foreach ($effectiveEnrollments as $enrollment) {
            $grade = $enrollment->grade;

            if (!$this->hasRecordedGrade($enrollment)) {
                continue;
            }

            $status = strtolower((string) ($grade->result_status ?? ''));

            // Repeating failed students repeat ONLY courses that truly failed.
            // conditionally_passed courses are treated as passed and are not repeated.
            if ((float) $grade->final_mark < 60 && !in_array($status, ['passed', 'conditionally_passed', 'supplementary_approved'], true)) {
                $this->createOrResetRetakeEnrollment(
                    $student,
                    $enrollment->course_id,
                    $nextAcademicYearId,
                    $studyYearId,
                    (int) $enrollment->semester_number,
                    false,
                    'Automatically enrolled because the student is repeating only failed courses.'
                );
            }
        }
    }

    private function createOrResetRetakeEnrollment(
        Student $student,
        int $courseId,
        int $academicYearId,
        int $studyYearId,
        int $semesterNumber,
        bool $isCarried,
        string $notes
    ): void {
        $enrollment = StudentCourseEnrollment::updateOrCreate(
            [
                'student_id' => $student->id,
                'course_id' => $courseId,
                'academic_year_id' => $academicYearId,
            ],
            [
                'study_year_id' => $studyYearId,
                'semester_number' => $semesterNumber,
                'is_carried' => $isCarried,
                'is_supplementary' => false,
                'status' => 'enrolled',
                'notes' => $notes,
            ]
        );

        // Do NOT create zero-grade rows for the new academic year.
        // The grade must remain empty until the examinations department enters it.
        // If a fake pending grade with zero values already exists for this new retake enrollment,
        // remove it so averages and student portal do not display 0.00 as a real mark.
        if (
            $enrollment->grade
            && $enrollment->grade->last_updated_at === null
            && $enrollment->grade->result_status === 'pending'
            && (float) ($enrollment->grade->final_mark ?? 0) === 0.0
        ) {
            $enrollment->grade->delete();
        }
    }

    private function resolveEffectiveEnrollmentsPerCourse(Collection $enrollments): Collection
    {
        return $enrollments
            ->groupBy('course_id')
            ->map(function (Collection $courseEnrollments) {
                $supplementaryWithRecordedGrade = $courseEnrollments
                    ->filter(function ($enrollment) {
                        return $enrollment->is_supplementary && $this->hasRecordedGrade($enrollment);
                    })
                    ->sortByDesc('id')
                    ->first();

                if ($supplementaryWithRecordedGrade) {
                    return $supplementaryWithRecordedGrade;
                }

                $latestRecordedEnrollment = $courseEnrollments
                    ->filter(function ($enrollment) {
                        return $this->hasRecordedGrade($enrollment);
                    })
                    ->sortByDesc(function ($enrollment) {
                        return [
                            (int) $enrollment->is_supplementary,
                            (int) $enrollment->id,
                        ];
                    })
                    ->first();

                if ($latestRecordedEnrollment) {
                    return $latestRecordedEnrollment;
                }

                return $courseEnrollments
                    ->sortByDesc(function ($enrollment) {
                        return [
                            (int) $enrollment->is_supplementary,
                            (int) $enrollment->id,
                        ];
                    })
                    ->first();
            })
            ->filter()
            ->values();
    }

    private function hasRecordedGrade(StudentCourseEnrollment $enrollment): bool
    {
        return (bool) (
            $enrollment->grade
            && $enrollment->grade->last_updated_at !== null
            && $enrollment->grade->final_mark !== null
        );
    }

    private function getNextAcademicYear(AcademicYear $currentAcademicYear): ?AcademicYear
    {
        return AcademicYear::where('id', '>', $currentAcademicYear->id)
            ->orderBy('id')
            ->first();
    }

    private function getNextStudyYear(int $programId, int $currentStudyYearId): ?StudyYear
    {
        $currentStudyYear = StudyYear::find($currentStudyYearId);

        if (!$currentStudyYear) {
            return null;
        }

        return StudyYear::where('program_id', $programId)
            ->where('year_number', $currentStudyYear->year_number + 1)
            ->first();
    }

    private function assertSpecializationExistsIfEnteringSecondStage(
        Student $student,
        StudentAcademicRecord $currentRecord
    ): void {
        $currentStudyYear = StudyYear::find($currentRecord->study_year_id);

        if (!$currentStudyYear) {
            return;
        }

        $nextStudyYear = StudyYear::where('program_id', $student->program_id)
            ->where('year_number', $currentStudyYear->year_number + 1)
            ->first();

        if (!$nextStudyYear) {
            return;
        }

        $isBachelorFiveYears = $student->program?->level === 'bachelor'
            && (int) $student->program?->total_years === 5;

        if (
            $isBachelorFiveYears
            && (int) $currentStudyYear->year_number === 3
            && (int) $nextStudyYear->year_number === 4
            && empty($student->specialization_id)
        ) {
            throw new Exception(
                'Student #' . $student->student_number . ' cannot move to year 4 before selecting a specialization.'
            );
        }
    }

    private function assertSpecializationMatchesStudyStage(Student $student, StudyYear $studyYear): void
    {
        $isBachelorFiveYears = $student->program?->level === 'bachelor'
            && (int) $student->program?->total_years === 5;

        if (!$isBachelorFiveYears) {
            return;
        }

        $yearNumber = (int) $studyYear->year_number;

        if (in_array($yearNumber, [1, 2, 3]) && !empty($student->specialization_id)) {
            throw new Exception(
                'Student #' . $student->student_number . ' must not have a specialization in bachelor years 1 to 3.'
            );
        }

        if (in_array($yearNumber, [4, 5]) && empty($student->specialization_id)) {
            throw new Exception(
                'Student #' . $student->student_number . ' must have a specialization in bachelor years 4 and 5.'
            );
        }
    }
}
