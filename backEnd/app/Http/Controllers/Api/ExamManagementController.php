<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Services\AutoPromotionService;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Throwable;

class ExamManagementController extends Controller
{
    public function confirmAcademicYearEnd(
        Request $request,
        int $academicYearId,
        AutoPromotionService $autoPromotionService,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $validated = $request->validate([
            'password' => ['required', 'string'],
        ]);

        $user = $request->user()?->loadMissing([
            'employee.department',
            'employee.managedDepartment',
            'doctor.department',
            'doctor.managedDepartment',
        ]);

        if (!$user || !$this->isExamsDepartmentManager($user)) {
            return response()->json([
                'message' => 'Only the manager of the exams department can confirm the end of the academic year.',
            ], 403);
        }

        if (!Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'message' => 'The provided password is incorrect.',
            ], 422);
        }

        $academicYear = AcademicYear::findOrFail($academicYearId);

        if ($academicYear->is_closed) {
            return response()->json([
                'message' => 'This academic year has already been closed.',
            ], 422);
        }

        $nextAcademicYear = AcademicYear::where('id', '>', $academicYear->id)
            ->orderBy('id')
            ->first();

        if (!$nextAcademicYear) {
            return response()->json([
                'message' => 'Cannot close this academic year because no next academic year exists.',
            ], 422);
        }

        try {
            $result = DB::transaction(function () use ($academicYear, $nextAcademicYear, $autoPromotionService) {
                $promotionResult = $autoPromotionService->promoteAllStudentsForAcademicYear($academicYear->id);

                $academicYear->update([
                    'is_closed' => true,
                    'is_current' => false,
                ]);

                $nextAcademicYear->update([
                    'is_current' => true,
                ]);

                return $promotionResult;
            });

            $activityLogService->log(
                optional($request->user())->id,
                'academic_year_closed',
                'academic_year',
                $academicYear->id,
                'Academic Year Closed',
                'The academic year was closed and auto-promotion was executed.',
                null,
                [
                    'processed_students' => $result['processed_students'] ?? 0,
                    'passed_students' => $result['passed_students'] ?? 0,
                    'promoted_students' => $result['promoted_students'] ?? 0,
                    'failed_students' => $result['failed_students'] ?? 0,
                    'exhausted_students' => $result['exhausted_students'] ?? 0,
                ],
                [
                    'next_academic_year_id' => $nextAcademicYear->id,
                ],
                $request
            );

            return response()->json([
                'message' => 'Academic year closed successfully and auto-promotion completed.',
                'data' => $result,
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Failed to close academic year: ' . $e->getMessage(),
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    private function isExamsDepartmentManager($user): bool
    {
        $employeeManagedDepartmentCode = $user->employee?->managedDepartment?->code;
        $doctorManagedDepartmentCode = $user->doctor?->managedDepartment?->code;

        return $employeeManagedDepartmentCode === 'exams'
            || $doctorManagedDepartmentCode === 'exams';
    }
}