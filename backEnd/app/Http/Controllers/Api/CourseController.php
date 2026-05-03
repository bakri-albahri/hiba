<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class CourseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $courses = Course::latest()->paginate(20);

        return response()->json($courses);
    }

    public function show(int $courseId): JsonResponse
    {
        $course = Course::with([
            'studyPlans',
            'doctorAssignments',
        ])->findOrFail($courseId);

        return response()->json($course);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'code' => ['required', 'string', 'max:255', 'unique:courses,code'],
            'name' => ['required', 'string', 'max:255'],
            'credit_hours' => ['required', 'integer', 'min:1'],
            'max_mark' => ['nullable', 'integer', 'min:1'],
            'pass_mark' => ['nullable', 'integer', 'min:1'],
            'is_active' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string'],
        ]);

        $course = Course::create([
            'code' => $validated['code'],
            'name' => $validated['name'],
            'credit_hours' => $validated['credit_hours'],
            'max_mark' => $validated['max_mark'] ?? 100,
            'pass_mark' => $validated['pass_mark'] ?? 60,
            'is_active' => $validated['is_active'] ?? true,
            'description' => $validated['description'] ?? null,
        ]);

        return response()->json([
            'message' => 'Course created successfully.',
            'data' => $course,
        ], 201);
    }

    public function update(Request $request, int $courseId): JsonResponse
    {
        $course = Course::findOrFail($courseId);

        $validated = $request->validate([
            'code' => [
                'sometimes',
                'required',
                'string',
                'max:255',
                Rule::unique('courses', 'code')->ignore($course->id),
            ],
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'credit_hours' => ['sometimes', 'required', 'integer', 'min:1'],
            'max_mark' => ['nullable', 'integer', 'min:1'],
            'pass_mark' => ['nullable', 'integer', 'min:1'],
            'is_active' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string'],
        ]);

        $course->update([
            'code' => $validated['code'] ?? $course->code,
            'name' => $validated['name'] ?? $course->name,
            'credit_hours' => $validated['credit_hours'] ?? $course->credit_hours,
            'max_mark' => array_key_exists('max_mark', $validated) ? $validated['max_mark'] : $course->max_mark,
            'pass_mark' => array_key_exists('pass_mark', $validated) ? $validated['pass_mark'] : $course->pass_mark,
            'is_active' => array_key_exists('is_active', $validated) ? $validated['is_active'] : $course->is_active,
            'description' => array_key_exists('description', $validated) ? $validated['description'] : $course->description,
        ]);

        return response()->json([
            'message' => 'Course updated successfully.',
            'data' => $course->fresh(),
        ]);
    }
}
