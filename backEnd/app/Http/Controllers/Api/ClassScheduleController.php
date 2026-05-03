<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassSchedule;
use App\Models\ClassScheduleItem;
use App\Models\Program;
use App\Models\Specialization;
use App\Models\StudyYear;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClassScheduleController extends Controller
{
    public function index(): JsonResponse
    {
        $schedules = ClassSchedule::with([
            'program',
            'studyYear',
            'specialization',
            'items.course',
        ])->latest()->paginate(20);

        return response()->json($schedules);
    }

    public function store(
        Request $request,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $validated = $request->validate([
            'program_id' => ['required', 'exists:programs,id'],
            'study_year_id' => ['required', 'exists:study_years,id'],
            'specialization_id' => ['nullable', 'exists:specializations,id'],
            'semester_number' => ['required', 'integer', 'in:1,2'],
            'name' => ['required', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
        ]);

        $program = Program::findOrFail($validated['program_id']);
        $studyYear = StudyYear::findOrFail($validated['study_year_id']);

        if ((int) $studyYear->program_id !== (int) $program->id) {
            return response()->json([
                'message' => 'The selected study year does not belong to the selected program.',
            ], 422);
        }

        if (!empty($validated['specialization_id'])) {
            $specialization = Specialization::findOrFail($validated['specialization_id']);

            if ((int) $specialization->program_id !== (int) $program->id) {
                return response()->json([
                    'message' => 'The selected specialization does not belong to the selected program.',
                ], 422);
            }
        }

        $schedule = ClassSchedule::create([
            'program_id' => $validated['program_id'],
            'study_year_id' => $validated['study_year_id'],
            'specialization_id' => $validated['specialization_id'] ?? null,
            'semester_number' => $validated['semester_number'],
            'name' => $validated['name'],
            'is_active' => $validated['is_active'] ?? true,
            'notes' => $validated['notes'] ?? null,
        ]);

        $activityLogService->log(
            optional($request->user())->id,
            'class_schedule_created',
            'class_schedule',
            $schedule->id,
            'Class Schedule Created',
            'A class schedule was created.',
            null,
            [
                'program_id' => $schedule->program_id,
                'study_year_id' => $schedule->study_year_id,
                'specialization_id' => $schedule->specialization_id,
                'semester_number' => $schedule->semester_number,
                'name' => $schedule->name,
            ],
            null,
            $request
        );

        return response()->json([
            'message' => 'Class schedule created successfully.',
            'data' => $schedule->load(['program', 'studyYear', 'specialization']),
        ], 201);
    }

    public function show(int $scheduleId): JsonResponse
    {
        $schedule = ClassSchedule::with([
            'program',
            'studyYear',
            'specialization',
            'items.course',
        ])->findOrFail($scheduleId);

        return response()->json($schedule);
    }

    public function update(
        Request $request,
        int $scheduleId,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $schedule = ClassSchedule::findOrFail($scheduleId);

        $oldValues = [
            'program_id' => $schedule->program_id,
            'study_year_id' => $schedule->study_year_id,
            'specialization_id' => $schedule->specialization_id,
            'semester_number' => $schedule->semester_number,
            'name' => $schedule->name,
            'is_active' => $schedule->is_active,
            'notes' => $schedule->notes,
        ];

        $validated = $request->validate([
            'program_id' => ['sometimes', 'required', 'exists:programs,id'],
            'study_year_id' => ['sometimes', 'required', 'exists:study_years,id'],
            'specialization_id' => ['nullable', 'exists:specializations,id'],
            'semester_number' => ['sometimes', 'required', 'integer', 'in:1,2'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'is_active' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
        ]);

        $programId = $validated['program_id'] ?? $schedule->program_id;
        $program = Program::findOrFail($programId);
        $studyYearId = $validated['study_year_id'] ?? $schedule->study_year_id;
        $studyYear = StudyYear::findOrFail($studyYearId);

        if ((int) $studyYear->program_id !== (int) $program->id) {
            return response()->json([
                'message' => 'The selected study year does not belong to the selected program.',
            ], 422);
        }

        if (array_key_exists('specialization_id', $validated) && !empty($validated['specialization_id'])) {
            $specialization = Specialization::findOrFail($validated['specialization_id']);

            if ((int) $specialization->program_id !== (int) $program->id) {
                return response()->json([
                    'message' => 'The selected specialization does not belong to the selected program.',
                ], 422);
            }
        }

        $schedule->update([
            'program_id' => $validated['program_id'] ?? $schedule->program_id,
            'study_year_id' => $validated['study_year_id'] ?? $schedule->study_year_id,
            'specialization_id' => array_key_exists('specialization_id', $validated)
                ? $validated['specialization_id']
                : $schedule->specialization_id,
            'semester_number' => $validated['semester_number'] ?? $schedule->semester_number,
            'name' => $validated['name'] ?? $schedule->name,
            'is_active' => array_key_exists('is_active', $validated) ? $validated['is_active'] : $schedule->is_active,
            'notes' => array_key_exists('notes', $validated) ? $validated['notes'] : $schedule->notes,
        ]);

        $activityLogService->log(
            optional($request->user())->id,
            'class_schedule_updated',
            'class_schedule',
            $schedule->id,
            'Class Schedule Updated',
            'A class schedule was updated.',
            $oldValues,
            [
                'program_id' => $schedule->fresh()->program_id,
                'study_year_id' => $schedule->fresh()->study_year_id,
                'specialization_id' => $schedule->fresh()->specialization_id,
                'semester_number' => $schedule->fresh()->semester_number,
                'name' => $schedule->fresh()->name,
                'is_active' => $schedule->fresh()->is_active,
                'notes' => $schedule->fresh()->notes,
            ],
            null,
            $request
        );

        return response()->json([
            'message' => 'Class schedule updated successfully.',
            'data' => $schedule->fresh()->load(['program', 'studyYear', 'specialization']),
        ]);
    }

    public function addItem(
        Request $request,
        int $scheduleId,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $schedule = ClassSchedule::findOrFail($scheduleId);

        $validated = $request->validate([
            'course_id' => ['required', 'exists:courses,id'],
            'day_of_week' => ['required', 'string', 'max:50'],
            'start_time' => ['required', 'date_format:H:i'],
            'end_time' => ['required', 'date_format:H:i', 'after:start_time'],
            'hall' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        $item = ClassScheduleItem::create([
            'class_schedule_id' => $schedule->id,
            'course_id' => $validated['course_id'],
            'day_of_week' => $validated['day_of_week'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'hall' => $validated['hall'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        $activityLogService->log(
            optional($request->user())->id,
            'class_schedule_item_created',
            'class_schedule_item',
            $item->id,
            'Class Schedule Item Created',
            'A class schedule item was created.',
            null,
            [
                'class_schedule_id' => $schedule->id,
                'course_id' => $item->course_id,
                'day_of_week' => $item->day_of_week,
                'start_time' => $item->start_time,
                'end_time' => $item->end_time,
                'hall' => $item->hall,
            ],
            null,
            $request
        );

        return response()->json([
            'message' => 'Class schedule item created successfully.',
            'data' => $item->load(['classSchedule', 'course']),
        ], 201);
    }

    public function updateItem(
        Request $request,
        int $itemId,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $item = ClassScheduleItem::findOrFail($itemId);

        $oldValues = [
            'course_id' => $item->course_id,
            'day_of_week' => $item->day_of_week,
            'start_time' => $item->start_time,
            'end_time' => $item->end_time,
            'hall' => $item->hall,
            'notes' => $item->notes,
        ];

        $validated = $request->validate([
            'course_id' => ['sometimes', 'required', 'exists:courses,id'],
            'day_of_week' => ['sometimes', 'required', 'string', 'max:50'],
            'start_time' => ['sometimes', 'required', 'date_format:H:i'],
            'end_time' => ['sometimes', 'required', 'date_format:H:i'],
            'hall' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string'],
        ]);

        if (
            array_key_exists('start_time', $validated)
            && array_key_exists('end_time', $validated)
            && $validated['end_time'] <= $validated['start_time']
        ) {
            return response()->json([
                'message' => 'The end time must be after the start time.',
            ], 422);
        }

        $item->update([
            'course_id' => $validated['course_id'] ?? $item->course_id,
            'day_of_week' => $validated['day_of_week'] ?? $item->day_of_week,
            'start_time' => $validated['start_time'] ?? $item->start_time,
            'end_time' => $validated['end_time'] ?? $item->end_time,
            'hall' => array_key_exists('hall', $validated) ? $validated['hall'] : $item->hall,
            'notes' => array_key_exists('notes', $validated) ? $validated['notes'] : $item->notes,
        ]);

        $activityLogService->log(
            optional($request->user())->id,
            'class_schedule_item_updated',
            'class_schedule_item',
            $item->id,
            'Class Schedule Item Updated',
            'A class schedule item was updated.',
            $oldValues,
            [
                'course_id' => $item->fresh()->course_id,
                'day_of_week' => $item->fresh()->day_of_week,
                'start_time' => $item->fresh()->start_time,
                'end_time' => $item->fresh()->end_time,
                'hall' => $item->fresh()->hall,
                'notes' => $item->fresh()->notes,
            ],
            null,
            $request
        );

        return response()->json([
            'message' => 'Class schedule item updated successfully.',
            'data' => $item->fresh()->load(['classSchedule', 'course']),
        ]);
    }

    public function destroyItem(
        Request $request,
        int $itemId,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $item = ClassScheduleItem::findOrFail($itemId);

        $oldValues = [
            'id' => $item->id,
            'class_schedule_id' => $item->class_schedule_id,
            'course_id' => $item->course_id,
            'day_of_week' => $item->day_of_week,
            'start_time' => $item->start_time,
            'end_time' => $item->end_time,
        ];

        $item->delete();

        $activityLogService->log(
            optional($request->user())->id,
            'class_schedule_item_deleted',
            'class_schedule_item',
            $oldValues['id'],
            'Class Schedule Item Deleted',
            'A class schedule item was deleted.',
            $oldValues,
            null,
            null,
            $request
        );

        return response()->json([
            'message' => 'Class schedule item deleted successfully.',
        ]);
    }
}