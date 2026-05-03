<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentAcademicRecord;
use App\Models\StudentCourseEnrollment;
use App\Models\StudyPlan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EnrollmentController extends Controller
{
    public function autoEnrollStudent(Request $request, int $studentId): JsonResponse
    {
        $student = Student::with(['program', 'specialization'])->findOrFail($studentId);

        $validated = $request->validate([
            'academic_year_id' => ['required', 'exists:academic_years,id'],
            'study_year_id' => ['required', 'exists:study_years,id'],
        ]);

        $academicRecord = StudentAcademicRecord::where('student_id', $student->id)
            ->where('academic_year_id', $validated['academic_year_id'])
            ->first();

        if (!$academicRecord) {
            return response()->json([
                'message' => 'Student does not have an academic record for the selected academic year.',
            ], 422);
        }

        $studyPlansQuery = StudyPlan::with('courses')
            ->where('program_id', $student->program_id)
            ->where('study_year_id', $validated['study_year_id'])
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

        if ($studyPlans->isEmpty()) {
            return response()->json([
                'message' => 'No active study plans found for this student.',
            ], 422);
        }

        $createdCount = 0;

        DB::transaction(function () use ($studyPlans, $student, $validated, &$createdCount) {
            foreach ($studyPlans as $studyPlan) {
                foreach ($studyPlan->courses as $course) {
                    $enrollment = StudentCourseEnrollment::firstOrCreate(
                        [
                            'student_id' => $student->id,
                            'course_id' => $course->id,
                            'academic_year_id' => $validated['academic_year_id'],
                        ],
                        [
                            'study_year_id' => $validated['study_year_id'],
                            'semester_number' => $studyPlan->semester_number,
                            'is_carried' => false,
                            'is_supplementary' => false,
                            'status' => 'enrolled',
                            'notes' => 'Auto-enrolled from study plan through API.',
                        ]
                    );

                    if ($enrollment->wasRecentlyCreated) {
                        $createdCount++;
                    }
                }
            }
        });

        return response()->json([
            'message' => 'Student auto-enrollment completed successfully.',
            'created_enrollments_count' => $createdCount,
            'data' => Student::with([
                'user',
                'courseEnrollments.course',
                'courseEnrollments.grade',
            ])->findOrFail($student->id),
        ]);
    }
}
