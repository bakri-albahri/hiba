<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProgramController extends Controller
{
    public function index(): JsonResponse
    {
        $programs = Program::with(['specializations', 'studyYears'])
            ->latest()
            ->paginate(20);

        return response()->json($programs);
    }

    public function show(int $programId): JsonResponse
    {
        $program = Program::with([
            'specializations',
            'studyYears',
            'studyPlans',
            'classSchedules',
        ])->findOrFail($programId);

        return response()->json($program);
    }

    public function store(
        Request $request,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:programs,name'],
            'level' => ['required', Rule::in(['bachelor', 'master', 'phd'])],
            'total_years' => ['required', 'integer', 'min:1', 'max:10'],
        ]);

        $program = Program::create($validated);

        $activityLogService->log(
            optional($request->user())->id,
            'program_created',
            'program',
            $program->id,
            'Program Created',
            'A new program was created.',
            null,
            $program->toArray(),
            null,
            $request
        );

        return response()->json([
            'message' => 'Program created successfully.',
            'data' => $program,
        ], 201);
    }

    public function update(
        Request $request,
        int $programId,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $program = Program::findOrFail($programId);

        $oldData = $program->toArray();

        $validated = $request->validate([
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('programs', 'name')->ignore($program->id),
            ],
            'level' => ['sometimes', 'required', Rule::in(['bachelor', 'master', 'phd'])],
            'total_years' => ['sometimes', 'required', 'integer', 'min:1', 'max:10'],
        ]);

        $program->update($validated);

        $activityLogService->log(
            optional($request->user())->id,
            'program_updated',
            'program',
            $program->id,
            'Program Updated',
            'A program was updated.',
            $oldData,
            $program->fresh()->toArray(),
            null,
            $request
        );

        return response()->json([
            'message' => 'Program updated successfully.',
            'data' => $program->fresh(),
        ]);
    }

    public function destroy(
        Request $request,
        int $programId,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $program = Program::with(['specializations', 'studyYears', 'studyPlans', 'classSchedules'])->findOrFail($programId);

        if ($program->specializations()->exists()) {
            return response()->json([
                'message' => 'Cannot delete program because it has specializations.',
            ], 422);
        }

        if ($program->studyYears()->exists()) {
            return response()->json([
                'message' => 'Cannot delete program because it has study years.',
            ], 422);
        }

        if ($program->studyPlans()->exists()) {
            return response()->json([
                'message' => 'Cannot delete program because it has study plans.',
            ], 422);
        }

        if ($program->classSchedules()->exists()) {
            return response()->json([
                'message' => 'Cannot delete program because it has class schedules.',
            ], 422);
        }

        $oldData = $program->toArray();

        $program->delete();

        $activityLogService->log(
            optional($request->user())->id,
            'program_deleted',
            'program',
            $oldData['id'],
            'Program Deleted',
            'A program was deleted.',
            $oldData,
            null,
            null,
            $request
        );

        return response()->json([
            'message' => 'Program deleted successfully.',
        ]);
    }
}