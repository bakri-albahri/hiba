<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\CourseAttendanceRequirement;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CourseAttendanceRequirementController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = CourseAttendanceRequirement::with(['course', 'academicYear'])
            ->latest();

        if ($request->filled('course_id')) {
            $query->where('course_id', $request->integer('course_id'));
        }

        if ($request->filled('academic_year_id')) {
            $query->where('academic_year_id', $request->integer('academic_year_id'));
        }

        if ($request->filled('semester_number')) {
            $query->where('semester_number', $request->integer('semester_number'));
        }

        return response()->json($query->paginate(50));
    }

    public function show(int $requirementId): JsonResponse
    {
        $requirement = CourseAttendanceRequirement::with(['course', 'academicYear'])
            ->findOrFail($requirementId);

        return response()->json($requirement);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'course_id' => ['required', 'exists:courses,id'],
            'academic_year_id' => ['required', 'exists:academic_years,id'],
            'semester_number' => ['required', 'integer', Rule::in([1, 2])],
            'required_attendance_count' => ['required', 'integer', 'min:1'],
        ]);

        $requirement = CourseAttendanceRequirement::updateOrCreate(
            [
                'course_id' => $validated['course_id'],
                'academic_year_id' => $validated['academic_year_id'],
                'semester_number' => $validated['semester_number'],
            ],
            [
                'required_attendance_count' => $validated['required_attendance_count'],
            ]
        );

        return response()->json([
            'message' => 'Course attendance requirement saved successfully.',
            'data' => $requirement->load(['course', 'academicYear']),
        ], $requirement->wasRecentlyCreated ? 201 : 200);
    }

    public function update(Request $request, int $requirementId): JsonResponse
    {
        $requirement = CourseAttendanceRequirement::findOrFail($requirementId);

        $validated = $request->validate([
            'course_id' => ['sometimes', 'required', 'exists:courses,id'],
            'academic_year_id' => ['sometimes', 'required', 'exists:academic_years,id'],
            'semester_number' => ['sometimes', 'required', 'integer', Rule::in([1, 2])],
            'required_attendance_count' => ['sometimes', 'required', 'integer', 'min:1'],
        ]);

        $requirement->update([
            'course_id' => $validated['course_id'] ?? $requirement->course_id,
            'academic_year_id' => $validated['academic_year_id'] ?? $requirement->academic_year_id,
            'semester_number' => $validated['semester_number'] ?? $requirement->semester_number,
            'required_attendance_count' => $validated['required_attendance_count'] ?? $requirement->required_attendance_count,
        ]);

        return response()->json([
            'message' => 'Course attendance requirement updated successfully.',
            'data' => $requirement->fresh()->load(['course', 'academicYear']),
        ]);
    }

    public function destroy(int $requirementId): JsonResponse
    {
        $requirement = CourseAttendanceRequirement::findOrFail($requirementId);
        $requirement->delete();

        return response()->json([
            'message' => 'Course attendance requirement deleted successfully.',
        ]);
    }
}
