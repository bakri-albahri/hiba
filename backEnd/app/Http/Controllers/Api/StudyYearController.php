<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Models\StudyYear;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudyYearController extends Controller
{
    public function index(): JsonResponse
    {
        $studyYears = StudyYear::with(['program'])
            ->latest()
            ->paginate(20);

        return response()->json($studyYears);
    }

    public function show(int $studyYearId): JsonResponse
    {
        $studyYear = StudyYear::with([
            'program',
            'studyPlans',
            'classSchedules',
        ])->findOrFail($studyYearId);

        return response()->json($studyYear);
    }

    public function store(
        Request $request,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $validated = $request->validate([
            'program_id' => ['required', 'exists:programs,id'],
            'year_number' => ['required', 'integer', 'min:1', 'max:10'],
            'name' => ['required', 'string', 'max:255'],
        ]);

        $program = Program::findOrFail($validated['program_id']);

        if ((int) $validated['year_number'] > (int) $program->total_years) {
            return response()->json([
                'message' => 'The year number cannot exceed the total years of the selected program.',
            ], 422);
        }

        $exists = StudyYear::where('program_id', $validated['program_id'])
            ->where('year_number', $validated['year_number'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'This study year already exists for the selected program.',
            ], 422);
        }

        $studyYear = StudyYear::create($validated);

        $activityLogService->log(
            optional($request->user())->id,
            'study_year_created',
            'study_year',
            $studyYear->id,
            'Study Year Created',
            'A new study year was created.',
            null,
            $studyYear->toArray(),
            null,
            $request
        );

        return response()->json([
            'message' => 'Study year created successfully.',
            'data' => $studyYear->load('program'),
        ], 201);
    }

    public function update(
        Request $request,
        int $studyYearId,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $studyYear = StudyYear::findOrFail($studyYearId);

        $oldData = $studyYear->toArray();

        $validated = $request->validate([
            'program_id' => ['sometimes', 'required', 'exists:programs,id'],
            'year_number' => ['sometimes', 'required', 'integer', 'min:1', 'max:10'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
        ]);

        $programId = $validated['program_id'] ?? $studyYear->program_id;
        $yearNumber = $validated['year_number'] ?? $studyYear->year_number;

        $program = Program::findOrFail($programId);

        if ((int) $yearNumber > (int) $program->total_years) {
            return response()->json([
                'message' => 'The year number cannot exceed the total years of the selected program.',
            ], 422);
        }

        $exists = StudyYear::where('program_id', $programId)
            ->where('year_number', $yearNumber)
            ->where('id', '!=', $studyYear->id)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'This study year already exists for the selected program.',
            ], 422);
        }

        $studyYear->update($validated);

        $activityLogService->log(
            optional($request->user())->id,
            'study_year_updated',
            'study_year',
            $studyYear->id,
            'Study Year Updated',
            'A study year was updated.',
            $oldData,
            $studyYear->fresh()->toArray(),
            null,
            $request
        );

        return response()->json([
            'message' => 'Study year updated successfully.',
            'data' => $studyYear->fresh()->load('program'),
        ]);
    }

    public function destroy(
        Request $request,
        int $studyYearId,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $studyYear = StudyYear::with(['studyPlans', 'classSchedules'])->findOrFail($studyYearId);

        if ($studyYear->studyPlans()->exists()) {
            return response()->json([
                'message' => 'Cannot delete study year because it has study plans.',
            ], 422);
        }

        if ($studyYear->classSchedules()->exists()) {
            return response()->json([
                'message' => 'Cannot delete study year because it has class schedules.',
            ], 422);
        }

        $oldData = $studyYear->toArray();

        $studyYear->delete();

        $activityLogService->log(
            optional($request->user())->id,
            'study_year_deleted',
            'study_year',
            $oldData['id'],
            'Study Year Deleted',
            'A study year was deleted.',
            $oldData,
            null,
            null,
            $request
        );

        return response()->json([
            'message' => 'Study year deleted successfully.',
        ]);
    }
}