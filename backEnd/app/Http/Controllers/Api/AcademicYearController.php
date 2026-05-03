<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class AcademicYearController extends Controller
{
    public function index(): JsonResponse
    {
        $academicYears = AcademicYear::latest()->paginate(20);

        return response()->json($academicYears);
    }

    public function show(int $academicYearId): JsonResponse
    {
        $academicYear = AcademicYear::findOrFail($academicYearId);

        return response()->json($academicYear);
    }

    public function store(
        Request $request,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', 'unique:academic_years,name'],
            'is_current' => ['nullable', 'boolean'],
            'is_closed' => ['nullable', 'boolean'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
        ]);

        $academicYear = DB::transaction(function () use ($validated) {
            if (!empty($validated['is_current'])) {
                AcademicYear::query()->update(['is_current' => false]);
            }

            return AcademicYear::create([
                'name' => $validated['name'],
                'is_current' => $validated['is_current'] ?? false,
                'is_closed' => $validated['is_closed'] ?? false,
                'start_date' => $validated['start_date'],
                'end_date' => $validated['end_date'],
            ]);
        });

        $activityLogService->log(
            optional($request->user())->id,
            'academic_year_created',
            'academic_year',
            $academicYear->id,
            'Academic Year Created',
            'A new academic year was created.',
            null,
            $academicYear->toArray(),
            null,
            $request
        );

        return response()->json([
            'message' => 'Academic year created successfully.',
            'data' => $academicYear,
        ], 201);
    }

    public function update(
        Request $request,
        int $academicYearId,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $academicYear = AcademicYear::findOrFail($academicYearId);

        $oldData = $academicYear->toArray();

        $validated = $request->validate([
            'name' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('academic_years', 'name')->ignore($academicYear->id),
            ],
            'is_current' => ['nullable', 'boolean'],
            'is_closed' => ['nullable', 'boolean'],
            'start_date' => ['sometimes', 'required', 'date'],
            'end_date' => ['sometimes', 'required', 'date'],
        ]);

        $startDate = $validated['start_date'] ?? $academicYear->start_date?->format('Y-m-d');
        $endDate = $validated['end_date'] ?? $academicYear->end_date?->format('Y-m-d');

        if ($startDate && $endDate && $endDate <= $startDate) {
            return response()->json([
                'message' => 'The end date must be after the start date.',
            ], 422);
        }

        DB::transaction(function () use ($validated, $academicYear) {
            if (!empty($validated['is_current'])) {
                AcademicYear::where('id', '!=', $academicYear->id)->update(['is_current' => false]);
            }

            $academicYear->update([
                'name' => $validated['name'] ?? $academicYear->name,
                'is_current' => array_key_exists('is_current', $validated) ? $validated['is_current'] : $academicYear->is_current,
                'is_closed' => array_key_exists('is_closed', $validated) ? $validated['is_closed'] : $academicYear->is_closed,
                'start_date' => $validated['start_date'] ?? $academicYear->start_date,
                'end_date' => $validated['end_date'] ?? $academicYear->end_date,
            ]);
        });

        $activityLogService->log(
            optional($request->user())->id,
            'academic_year_updated',
            'academic_year',
            $academicYear->id,
            'Academic Year Updated',
            'An academic year was updated.',
            $oldData,
            $academicYear->fresh()->toArray(),
            null,
            $request
        );

        return response()->json([
            'message' => 'Academic year updated successfully.',
            'data' => $academicYear->fresh(),
        ]);
    }

    public function destroy(
        Request $request,
        int $academicYearId,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $academicYear = AcademicYear::findOrFail($academicYearId);

        if ($academicYear->is_current) {
            return response()->json([
                'message' => 'Cannot delete the current academic year.',
            ], 422);
        }

        $oldData = $academicYear->toArray();

        $academicYear->delete();

        $activityLogService->log(
            optional($request->user())->id,
            'academic_year_deleted',
            'academic_year',
            $oldData['id'],
            'Academic Year Deleted',
            'An academic year was deleted.',
            $oldData,
            null,
            null,
            $request
        );

        return response()->json([
            'message' => 'Academic year deleted successfully.',
        ]);
    }
}