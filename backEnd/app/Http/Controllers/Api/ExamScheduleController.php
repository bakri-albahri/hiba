<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ExamSchedule;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExamScheduleController extends Controller
{
    public function index(): JsonResponse
    {
        $schedules = ExamSchedule::with(['course', 'academicYear'])
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
            'semester_number' => ['required', 'integer', 'in:1,2'],
            'exam_date' => ['required', 'date'],
            'exam_room' => ['nullable', 'string', 'max:255'],
        ]);

        $schedule = ExamSchedule::create($validated);

        $activityLogService->log(
            optional($request->user())->id,
            'exam_schedule_created',
            'exam_schedule',
            $schedule->id,
            'Exam Schedule Created',
            'A regular exam schedule entry was created.',
            null,
            [
                'course_id' => $schedule->course_id,
                'academic_year_id' => $schedule->academic_year_id,
                'semester_number' => $schedule->semester_number,
                'exam_date' => $schedule->exam_date,
                'exam_room' => $schedule->exam_room,
            ],
            null,
            $request
        );

        return response()->json([
            'message' => 'Exam schedule created successfully.',
            'data' => $schedule->load(['course', 'academicYear']),
        ], 201);
    }

    public function show(int $scheduleId): JsonResponse
    {
        $schedule = ExamSchedule::with(['course', 'academicYear'])
            ->findOrFail($scheduleId);

        return response()->json($schedule);
    }

    public function update(
        Request $request,
        int $scheduleId,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $schedule = ExamSchedule::findOrFail($scheduleId);

        $oldValues = [
            'course_id' => $schedule->course_id,
            'academic_year_id' => $schedule->academic_year_id,
            'semester_number' => $schedule->semester_number,
            'exam_date' => $schedule->exam_date,
            'exam_room' => $schedule->exam_room,
        ];

        $validated = $request->validate([
            'course_id' => ['sometimes', 'required', 'exists:courses,id'],
            'academic_year_id' => ['sometimes', 'required', 'exists:academic_years,id'],
            'semester_number' => ['sometimes', 'required', 'integer', 'in:1,2'],
            'exam_date' => ['sometimes', 'required', 'date'],
            'exam_room' => ['nullable', 'string', 'max:255'],
        ]);

        $schedule->update([
            'course_id' => $validated['course_id'] ?? $schedule->course_id,
            'academic_year_id' => $validated['academic_year_id'] ?? $schedule->academic_year_id,
            'semester_number' => $validated['semester_number'] ?? $schedule->semester_number,
            'exam_date' => $validated['exam_date'] ?? $schedule->exam_date,
            'exam_room' => array_key_exists('exam_room', $validated) ? $validated['exam_room'] : $schedule->exam_room,
        ]);

        $activityLogService->log(
            optional($request->user())->id,
            'exam_schedule_updated',
            'exam_schedule',
            $schedule->id,
            'Exam Schedule Updated',
            'A regular exam schedule entry was updated.',
            $oldValues,
            [
                'course_id' => $schedule->fresh()->course_id,
                'academic_year_id' => $schedule->fresh()->academic_year_id,
                'semester_number' => $schedule->fresh()->semester_number,
                'exam_date' => $schedule->fresh()->exam_date,
                'exam_room' => $schedule->fresh()->exam_room,
            ],
            null,
            $request
        );

        return response()->json([
            'message' => 'Exam schedule updated successfully.',
            'data' => $schedule->fresh()->load(['course', 'academicYear']),
        ]);
    }

    public function destroy(
        Request $request,
        int $scheduleId,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $schedule = ExamSchedule::findOrFail($scheduleId);

        $oldValues = [
            'id' => $schedule->id,
            'course_id' => $schedule->course_id,
            'academic_year_id' => $schedule->academic_year_id,
            'semester_number' => $schedule->semester_number,
            'exam_date' => $schedule->exam_date,
            'exam_room' => $schedule->exam_room,
        ];

        $schedule->delete();

        $activityLogService->log(
            optional($request->user())->id,
            'exam_schedule_deleted',
            'exam_schedule',
            $oldValues['id'],
            'Exam Schedule Deleted',
            'A regular exam schedule entry was deleted.',
            $oldValues,
            null,
            null,
            $request
        );

        return response()->json([
            'message' => 'Exam schedule deleted successfully.',
        ]);
    }
}