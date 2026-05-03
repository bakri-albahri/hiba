<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Models\Specialization;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class SpecializationController extends Controller
{
    public function index(): JsonResponse
    {
        $specializations = Specialization::with(['program'])
            ->latest()
            ->paginate(20);

        return response()->json($specializations);
    }

    public function show(int $specializationId): JsonResponse
    {
        $specialization = Specialization::with([
            'program',
            'studyPlans',
            'classSchedules',
        ])->findOrFail($specializationId);

        return response()->json($specialization);
    }

    public function store(
        Request $request,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $validated = $request->validate([
            'program_id' => ['required', 'exists:programs,id'],
            'name' => ['required', 'string', 'max:255'],
        ]);

        $exists = Specialization::where('program_id', $validated['program_id'])
            ->where('name', $validated['name'])
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'This specialization already exists for the selected program.',
            ], 422);
        }

        $specialization = Specialization::create($validated);

        $activityLogService->log(
            optional($request->user())->id,
            'specialization_created',
            'specialization',
            $specialization->id,
            'Specialization Created',
            'A new specialization was created.',
            null,
            $specialization->toArray(),
            null,
            $request
        );

        return response()->json([
            'message' => 'Specialization created successfully.',
            'data' => $specialization->load('program'),
        ], 201);
    }

    public function update(
        Request $request,
        int $specializationId,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $specialization = Specialization::findOrFail($specializationId);

        $oldData = $specialization->toArray();

        $validated = $request->validate([
            'program_id' => ['sometimes', 'required', 'exists:programs,id'],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
        ]);

        $programId = $validated['program_id'] ?? $specialization->program_id;
        $name = $validated['name'] ?? $specialization->name;

        $exists = Specialization::where('program_id', $programId)
            ->where('name', $name)
            ->where('id', '!=', $specialization->id)
            ->exists();

        if ($exists) {
            return response()->json([
                'message' => 'This specialization already exists for the selected program.',
            ], 422);
        }

        $specialization->update($validated);

        $activityLogService->log(
            optional($request->user())->id,
            'specialization_updated',
            'specialization',
            $specialization->id,
            'Specialization Updated',
            'A specialization was updated.',
            $oldData,
            $specialization->fresh()->toArray(),
            null,
            $request
        );

        return response()->json([
            'message' => 'Specialization updated successfully.',
            'data' => $specialization->fresh()->load('program'),
        ]);
    }

    public function destroy(
        Request $request,
        int $specializationId,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $specialization = Specialization::with(['studyPlans', 'classSchedules'])->findOrFail($specializationId);

        if ($specialization->studyPlans()->exists()) {
            return response()->json([
                'message' => 'Cannot delete specialization because it has study plans.',
            ], 422);
        }

        if ($specialization->classSchedules()->exists()) {
            return response()->json([
                'message' => 'Cannot delete specialization because it has class schedules.',
            ], 422);
        }

        $oldData = $specialization->toArray();

        $specialization->delete();

        $activityLogService->log(
            optional($request->user())->id,
            'specialization_deleted',
            'specialization',
            $oldData['id'],
            'Specialization Deleted',
            'A specialization was deleted.',
            $oldData,
            null,
            null,
            $request
        );

        return response()->json([
            'message' => 'Specialization deleted successfully.',
        ]);
    }
}