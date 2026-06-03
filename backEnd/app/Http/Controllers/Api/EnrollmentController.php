<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Services\StudentAutoEnrollmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class EnrollmentController extends Controller
{
    public function autoEnrollStudent(
        Request $request,
        int $studentId,
        StudentAutoEnrollmentService $studentAutoEnrollmentService
    ): JsonResponse {
        $student = Student::with(['program', 'specialization'])->findOrFail($studentId);

        $validated = $request->validate([
            'academic_year_id' => ['required', 'exists:academic_years,id'],
            'study_year_id' => ['required', 'exists:study_years,id'],
        ]);

        try {
            $autoEnrollment = $studentAutoEnrollmentService->autoEnroll(
                $student,
                (int) $validated['academic_year_id'],
                (int) $validated['study_year_id'],
                'Auto-enrolled from study plan through API.'
            );

            return response()->json([
                'message' => 'Student auto-enrollment completed successfully.',
                ...$autoEnrollment,
                'data' => Student::with([
                    'user',
                    'courseEnrollments.course',
                    'courseEnrollments.academicYear',
                    'courseEnrollments.studyYear',
                    'courseEnrollments.grade',
                ])->findOrFail($student->id),
            ]);
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
            ], 422);
        }
    }
}
