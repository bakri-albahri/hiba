<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Program;
use App\Models\Specialization;
use App\Models\StudyPlan;
use App\Models\StudyPlanCourse;
use App\Models\StudyYear;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudyPlanController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $studyPlans = StudyPlan::with([
            'program',
            'specialization',
            'studyYear',
            'courses',
        ])->latest()->paginate(20);

        return response()->json($studyPlans);
    }

    public function show(int $studyPlanId): JsonResponse
    {
        $studyPlan = StudyPlan::with([
            'program',
            'specialization',
            'studyYear',
            'studyPlanCourses.course',
        ])->findOrFail($studyPlanId);

        return response()->json($studyPlan);
    }

    public function store(
        Request $request,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $validated = $request->validate([
            'program_id' => ['required', 'exists:programs,id'],
            'specialization_id' => ['nullable', 'exists:specializations,id'],
            'study_year_id' => ['required', 'exists:study_years,id'],
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

        $stageValidationError = $this->validateBachelorStageSpecialization(
            $program,
            $studyYear,
            $validated['specialization_id'] ?? null
        );

        if ($stageValidationError) {
            return response()->json([
                'message' => $stageValidationError,
            ], 422);
        }

        $studyPlan = StudyPlan::create([
            'program_id' => $validated['program_id'],
            'specialization_id' => $validated['specialization_id'] ?? null,
            'study_year_id' => $validated['study_year_id'],
            'semester_number' => $validated['semester_number'],
            'name' => $validated['name'],
            'is_active' => $validated['is_active'] ?? true,
            'notes' => $validated['notes'] ?? null,
        ]);

        $activityLogService->log(
            optional($request->user())->id,
            'study_plan_created',
            'study_plan',
            $studyPlan->id,
            'Study Plan Created',
            'A study plan was created.',
            null,
            [
                'program_id' => $studyPlan->program_id,
                'specialization_id' => $studyPlan->specialization_id,
                'study_year_id' => $studyPlan->study_year_id,
                'semester_number' => $studyPlan->semester_number,
                'name' => $studyPlan->name,
            ],
            null,
            $request
        );

        return response()->json([
            'message' => 'Study plan created successfully.',
            'data' => $studyPlan->load(['program', 'specialization', 'studyYear']),
        ], 201);
    }

    public function attachCourses(
        Request $request,
        int $studyPlanId,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $studyPlan = StudyPlan::findOrFail($studyPlanId);

        $validated = $request->validate([
            'courses' => ['required', 'array', 'min:1'],
            'courses.*.course_id' => ['required', 'exists:courses,id'],
            'courses.*.is_mandatory' => ['nullable', 'boolean'],
            'courses.*.display_order' => ['nullable', 'integer', 'min:1'],
        ]);

        foreach ($validated['courses'] as $courseData) {
            StudyPlanCourse::updateOrCreate(
                [
                    'study_plan_id' => $studyPlan->id,
                    'course_id' => $courseData['course_id'],
                ],
                [
                    'is_mandatory' => $courseData['is_mandatory'] ?? true,
                    'display_order' => $courseData['display_order'] ?? 1,
                ]
            );
        }

        $activityLogService->log(
            optional($request->user())->id,
            'study_plan_courses_attached',
            'study_plan',
            $studyPlan->id,
            'Courses Attached To Study Plan',
            'Courses were attached to a study plan.',
            null,
            [
                'study_plan_id' => $studyPlan->id,
                'courses_count' => count($validated['courses']),
            ],
            [
                'courses' => $validated['courses'],
            ],
            $request
        );

        return response()->json([
            'message' => 'Courses attached to study plan successfully.',
            'data' => $studyPlan->fresh()->load([
                'program',
                'specialization',
                'studyYear',
                'studyPlanCourses.course',
            ]),
        ]);
    }

    private function validateBachelorStageSpecialization(
        Program $program,
        StudyYear $studyYear,
        $specializationId
    ): ?string {
        $isBachelorFiveYears = $program->level === 'bachelor' && (int) $program->total_years === 5;

        if (!$isBachelorFiveYears) {
            return null;
        }

        $yearNumber = (int) $studyYear->year_number;

        if (in_array($yearNumber, [1, 2, 3]) && !empty($specializationId)) {
            return 'For the first stage of the bachelor program (years 1 to 3), specialization must not be selected in study plans.';
        }

        if (in_array($yearNumber, [4, 5]) && empty($specializationId)) {
            return 'For the second stage of the bachelor program (years 4 and 5), specialization is required in study plans.';
        }

        return null;
    }
}