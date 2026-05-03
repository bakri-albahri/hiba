<?php

namespace App\Services;

use App\Models\Student;
use App\Models\StudentAcademicRecord;
use App\Models\StudentCourseEnrollment;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Exception;

class AcademicProgressService
{
    public function evaluateStudentYear(int $studentId, int $academicYearId): StudentAcademicRecord
    {
        return DB::transaction(function () use ($studentId, $academicYearId) {
            $student = Student::findOrFail($studentId);

            $record = StudentAcademicRecord::where('student_id', $studentId)
                ->where('academic_year_id', $academicYearId)
                ->firstOrFail();

            $allEnrollments = StudentCourseEnrollment::with(['course', 'grade'])
                ->where('student_id', $studentId)
                ->where('academic_year_id', $academicYearId)
                ->get();

            if ($allEnrollments->isEmpty()) {
                throw new Exception('No course enrollments found for this student in the selected academic year.');
            }

            $effectiveEnrollments = $this->resolveEffectiveEnrollmentsPerCourse($allEnrollments);

            if ($effectiveEnrollments->isEmpty()) {
                throw new Exception('No effective course enrollments found for this student in the selected academic year.');
            }

            $gradedEnrollments = $effectiveEnrollments->filter(function ($enrollment) {
                return $this->hasRecordedGrade($enrollment);
            });

            if ($gradedEnrollments->isEmpty()) {
                throw new Exception('No recorded grades found for this student in the selected academic year.');
            }

            $annualAverage = round(
                $gradedEnrollments->avg(function ($enrollment) {
                    return (float) $enrollment->grade->final_mark;
                }),
                2
            );

            $carriedCoursesCount = 0;
            $carriedCoursesCreditSum = 0;

            foreach ($effectiveEnrollments as $enrollment) {
                $grade = $enrollment->grade;

                if (!$this->hasRecordedGrade($enrollment)) {
                    if ($grade) {
                        $grade->result_status = 'pending';
                        $grade->save();
                    }

                    $enrollment->is_carried = false;
                    $enrollment->save();

                    continue;
                }

                $finalMark = (float) $grade->final_mark;
                $creditHours = (int) ($enrollment->course->credit_hours ?? 0);

                if ($finalMark >= 60) {
                    $grade->result_status = 'passed';
                    $enrollment->is_carried = false;
                } elseif ($finalMark >= 40 && $annualAverage >= 60) {
                    $grade->result_status = 'conditionally_passed';
                    $enrollment->is_carried = false;
                } else {
                    $grade->result_status = 'carried';
                    $enrollment->is_carried = true;
                    $carriedCoursesCount++;
                    $carriedCoursesCreditSum += $creditHours;
                }

                $grade->save();

                $enrollment->status = 'completed';
                $enrollment->save();
            }

            $this->markNonEffectiveEnrollmentsAsArchived($allEnrollments, $effectiveEnrollments);

            if ($annualAverage >= 60 && $carriedCoursesCount === 0) {
                $academicResult = 'passed';
            } elseif ($annualAverage >= 60 && $carriedCoursesCreditSum <= 6) {
                $academicResult = 'promoted';
            } else {
                $academicResult = 'failed';
            }

            $consecutiveFailures = $this->calculateConsecutiveFailures(
                $studentId,
                $record->study_year_id,
                $academicYearId,
                $academicResult
            );

            if ($consecutiveFailures >= 3) {
                $academicResult = 'exhausted';

                $student->update([
                    'is_exhausted' => true,
                    'is_active_registration' => false,
                ]);
            }

            $record->update([
                'annual_average' => $annualAverage,
                'academic_result' => $academicResult,
                'carried_courses_count' => $carriedCoursesCount,
                'carried_courses_credit_sum' => $carriedCoursesCreditSum,
                'consecutive_failures_in_same_year' => $consecutiveFailures,
            ]);

            return $record->fresh();
        });
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

    private function markNonEffectiveEnrollmentsAsArchived(Collection $allEnrollments, Collection $effectiveEnrollments): void
    {
        $effectiveIds = $effectiveEnrollments
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        foreach ($allEnrollments as $enrollment) {
            if (in_array((int) $enrollment->id, $effectiveIds, true)) {
                continue;
            }

            if ($enrollment->status !== 'archived') {
                $enrollment->status = 'archived';
                $enrollment->save();
            }

            if ($enrollment->is_carried) {
                $enrollment->is_carried = false;
                $enrollment->save();
            }

            if ($enrollment->grade && $enrollment->grade->result_status !== 'archived') {
                $enrollment->grade->result_status = 'archived';
                $enrollment->grade->save();
            }
        }
    }

    private function hasRecordedGrade(StudentCourseEnrollment $enrollment): bool
    {
        return (bool) (
            $enrollment->grade
            && $enrollment->grade->last_updated_at !== null
            && $enrollment->grade->final_mark !== null
        );
    }

    private function calculateConsecutiveFailures(
        int $studentId,
        int $studyYearId,
        int $academicYearId,
        string $currentAcademicResult
    ): int {
        if ($currentAcademicResult !== 'failed') {
            return 0;
        }

        $previousRecords = StudentAcademicRecord::where('student_id', $studentId)
            ->where('study_year_id', $studyYearId)
            ->where('academic_year_id', '<', $academicYearId)
            ->orderByDesc('academic_year_id')
            ->get();

        $count = 1;

        foreach ($previousRecords as $record) {
            if ($record->academic_result === 'failed') {
                $count++;
            } else {
                break;
            }
        }

        return $count;
    }

    public function getCarriedEnrollments(int $studentId, int $academicYearId): Collection
    {
        $allEnrollments = StudentCourseEnrollment::with(['course', 'grade'])
            ->where('student_id', $studentId)
            ->where('academic_year_id', $academicYearId)
            ->get();

        $effectiveEnrollments = $this->resolveEffectiveEnrollmentsPerCourse($allEnrollments);

        return $effectiveEnrollments
            ->filter(function ($enrollment) {
                return (bool) $enrollment->is_carried;
            })
            ->values();
    }
}