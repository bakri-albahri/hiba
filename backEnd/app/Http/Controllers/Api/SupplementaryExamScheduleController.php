<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SupplementaryExamSchedule;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupplementaryExamScheduleController extends Controller
{
    public function index(): JsonResponse
    {
        $schedules = SupplementaryExamSchedule::with(['course', 'academicYear'])
            ->latest()
            ->paginate(20);

        return response()->json($schedules);
    }

    public function store(
        Request $request,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $validated = $request->validate([
            'course_id' => ['required', 'exists:courses,id'],
            'academic_year_id' => ['required', 'exists:academic_years,id'],
            'exam_date' => ['required', 'date'],
            'exam_room' => ['nullable', 'string', 'max:255'],
        ]);

        $schedule = SupplementaryExamSchedule::create($validated);

        $activityLogService->log(
            optional($request->user())->id,
            'supplementary_exam_schedule_created',
            'supplementary_exam_schedule',
            $schedule->id,
            'Supplementary Exam Schedule Created',
            'A supplementary exam schedule entry was created.',
            null,
            [
                'course_id' => $schedule->course_id,
                'academic_year_id' => $schedule->academic_year_id,
                'exam_date' => $schedule->exam_date,
                'exam_room' => $schedule->exam_room,
            ],
            null,
            $request
        );

        return response()->json([
            'message' => 'Supplementary exam schedule created successfully.',
            'data' => $schedule->load(['course', 'academicYear']),
        ], 201);
    }

    public function show(int $scheduleId): JsonResponse
    {
        $schedule = SupplementaryExamSchedule::with(['course', 'academicYear'])
            ->findOrFail($scheduleId);

        return response()->json($schedule);
    }

    public function update(
        Request $request,
        int $scheduleId,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $schedule = SupplementaryExamSchedule::findOrFail($scheduleId);

        $oldValues = [
            'course_id' => $schedule->course_id,
            'academic_year_id' => $schedule->academic_year_id,
            'exam_date' => $schedule->exam_date,
            'exam_room' => $schedule->exam_room,
        ];

        $validated = $request->validate([
            'course_id' => ['sometimes', 'required', 'exists:courses,id'],
            'academic_year_id' => ['sometimes', 'required', 'exists:academic_years,id'],
            'exam_date' => ['sometimes', 'required', 'date'],
            'exam_room' => ['nullable', 'string', 'max:255'],
        ]);

        $schedule->update([
            'course_id' => $validated['course_id'] ?? $schedule->course_id,
            'academic_year_id' => $validated['academic_year_id'] ?? $schedule->academic_year_id,
            'exam_date' => $validated['exam_date'] ?? $schedule->exam_date,
            'exam_room' => array_key_exists('exam_room', $validated) ? $validated['exam_room'] : $schedule->exam_room,
        ]);

        $activityLogService->log(
            optional($request->user())->id,
            'supplementary_exam_schedule_updated',
            'supplementary_exam_schedule',
            $schedule->id,
            'Supplementary Exam Schedule Updated',
            'A supplementary exam schedule entry was updated.',
            $oldValues,
            [
                'course_id' => $schedule->fresh()->course_id,
                'academic_year_id' => $schedule->fresh()->academic_year_id,
                'exam_date' => $schedule->fresh()->exam_date,
                'exam_room' => $schedule->fresh()->exam_room,
            ],
            null,
            $request
        );

        return response()->json([
            'message' => 'Supplementary exam schedule updated successfully.',
            'data' => $schedule->fresh()->load(['course', 'academicYear']),
        ]);
    }

    public function destroy(
        Request $request,
        int $scheduleId,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $schedule = SupplementaryExamSchedule::findOrFail($scheduleId);

        $oldValues = [
            'id' => $schedule->id,
            'course_id' => $schedule->course_id,
            'academic_year_id' => $schedule->academic_year_id,
            'exam_date' => $schedule->exam_date,
            'exam_room' => $schedule->exam_room,
        ];

        $schedule->delete();

        $activityLogService->log(
            optional($request->user())->id,
            'supplementary_exam_schedule_deleted',
            'supplementary_exam_schedule',
            $oldValues['id'],
            'Supplementary Exam Schedule Deleted',
            'A supplementary exam schedule entry was deleted.',
            $oldValues,
            null,
            null,
            $request
        );

        return response()->json([
            'message' => 'Supplementary exam schedule deleted successfully.',
        ]);
    }
}