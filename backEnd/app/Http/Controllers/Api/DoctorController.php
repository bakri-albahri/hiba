<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Doctor;
use App\Models\User;
use App\Services\NotificationService;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class DoctorController extends Controller
{
    public function index(): JsonResponse
    {
        $doctors = Doctor::with(['user', 'department', 'courseAssignments.course', 'courseAssignments.academicYear'])
            ->latest()
            ->get();

        return response()->json($doctors);
    }

    public function store(
        Request $request,
        NotificationService $notificationService,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $validated = $request->validate([
            'full_name' => ['required', 'string', 'max:255'],
            'father_name' => ['nullable', 'string', 'max:255'],
            'mother_name' => ['nullable', 'string', 'max:255'],
            'birth_date' => ['nullable', 'date'],
            'birth_place' => ['nullable', 'string', 'max:255'],
            'central_registry' => ['nullable', 'string', 'max:255'],
            'national_id' => ['nullable', 'string', 'max:255', 'unique:users,national_id'],
            'nationality' => ['nullable', 'string', 'max:255'],
            'gender' => ['nullable', Rule::in(['male', 'female'])],
            'mobile' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],

            'department_id' => ['nullable', 'exists:departments,id'],
            'academic_title' => ['nullable', 'string', 'max:255'],
            'employee_number' => ['nullable', 'string', 'max:255', 'unique:doctors,employee_number'],
            'is_active' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
        ]);

        $doctor = DB::transaction(function () use ($validated) {
            $user = User::create([
                'full_name' => $validated['full_name'],
                'father_name' => $validated['father_name'] ?? null,
                'mother_name' => $validated['mother_name'] ?? null,
                'birth_date' => $validated['birth_date'] ?? null,
                'birth_place' => $validated['birth_place'] ?? null,
                'central_registry' => $validated['central_registry'] ?? null,
                'national_id' => $validated['national_id'] ?? null,
                'nationality' => $validated['nationality'] ?? null,
                'gender' => $validated['gender'] ?? null,
                'mobile' => $validated['mobile'] ?? null,
                'address' => $validated['address'] ?? null,
                'email' => $validated['email'],
                'password' => $validated['password'],
                'type' => 'doctor',
            ]);

            return Doctor::create([
                'user_id' => $user->id,
                'department_id' => $validated['department_id'] ?? null,
                'academic_title' => $validated['academic_title'] ?? null,
                'employee_number' => $validated['employee_number'] ?? null,
                'is_active' => $validated['is_active'] ?? true,
                'notes' => $validated['notes'] ?? null,
            ]);
        });

        $notificationService->sendToUser(
            $doctor->user_id,
            null,
            'doctor_account_created',
            'Doctor Account Created',
            'Your doctor account has been created successfully. You can now access the university system.',
            [
                'doctor_id' => $doctor->id,
                'employee_number' => $doctor->employee_number,
            ]
        );

        $activityLogService->log(
            optional($request->user())->id,
            'doctor_created',
            'doctor',
            $doctor->id,
            'Doctor Created',
            'A new doctor account was created.',
            null,
            [
                'doctor_id' => $doctor->id,
                'employee_number' => $doctor->employee_number,
                'department_id' => $doctor->department_id,
                'academic_title' => $doctor->academic_title,
            ],
            null,
            $request
        );

        return response()->json([
            'message' => 'Doctor created successfully.',
            'data' => $doctor->load(['user', 'department']),
        ], 201);
    }

    public function show(int $doctorId): JsonResponse
    {
        $doctor = Doctor::with([
            'user',
            'department',
            'courseAssignments.course',
            'courseAssignments.academicYear',
        ])->findOrFail($doctorId);

        return response()->json($doctor);
    }

    public function update(
        Request $request,
        int $doctorId,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $doctor = Doctor::with('user')->findOrFail($doctorId);

        $oldDoctorData = [
            'department_id' => $doctor->department_id,
            'academic_title' => $doctor->academic_title,
            'employee_number' => $doctor->employee_number,
            'is_active' => $doctor->is_active,
            'notes' => $doctor->notes,
        ];

        $validated = $request->validate([
            'full_name' => ['sometimes', 'required', 'string', 'max:255'],
            'father_name' => ['nullable', 'string', 'max:255'],
            'mother_name' => ['nullable', 'string', 'max:255'],
            'birth_date' => ['nullable', 'date'],
            'birth_place' => ['nullable', 'string', 'max:255'],
            'central_registry' => ['nullable', 'string', 'max:255'],
            'national_id' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('users', 'national_id')->ignore($doctor->user_id),
            ],
            'nationality' => ['nullable', 'string', 'max:255'],
            'gender' => ['nullable', Rule::in(['male', 'female'])],
            'mobile' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string'],
            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($doctor->user_id),
            ],
            'password' => ['nullable', 'string', 'min:8'],

            'department_id' => ['nullable', 'exists:departments,id'],
            'academic_title' => ['nullable', 'string', 'max:255'],
            'employee_number' => [
                'nullable',
                'string',
                'max:255',
                Rule::unique('doctors', 'employee_number')->ignore($doctor->id),
            ],
            'is_active' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($doctor, $validated) {
            $doctor->user->update([
                'full_name' => $validated['full_name'] ?? $doctor->user->full_name,
                'father_name' => array_key_exists('father_name', $validated) ? $validated['father_name'] : $doctor->user->father_name,
                'mother_name' => array_key_exists('mother_name', $validated) ? $validated['mother_name'] : $doctor->user->mother_name,
                'birth_date' => array_key_exists('birth_date', $validated) ? $validated['birth_date'] : $doctor->user->birth_date,
                'birth_place' => array_key_exists('birth_place', $validated) ? $validated['birth_place'] : $doctor->user->birth_place,
                'central_registry' => array_key_exists('central_registry', $validated) ? $validated['central_registry'] : $doctor->user->central_registry,
                'national_id' => array_key_exists('national_id', $validated) ? $validated['national_id'] : $doctor->user->national_id,
                'nationality' => array_key_exists('nationality', $validated) ? $validated['nationality'] : $doctor->user->nationality,
                'gender' => array_key_exists('gender', $validated) ? $validated['gender'] : $doctor->user->gender,
                'mobile' => array_key_exists('mobile', $validated) ? $validated['mobile'] : $doctor->user->mobile,
                'address' => array_key_exists('address', $validated) ? $validated['address'] : $doctor->user->address,
                'email' => $validated['email'] ?? $doctor->user->email,
                'password' => $validated['password'] ?? $doctor->user->password,
            ]);

            $doctor->update([
                'department_id' => array_key_exists('department_id', $validated) ? $validated['department_id'] : $doctor->department_id,
                'academic_title' => array_key_exists('academic_title', $validated) ? $validated['academic_title'] : $doctor->academic_title,
                'employee_number' => array_key_exists('employee_number', $validated) ? $validated['employee_number'] : $doctor->employee_number,
                'is_active' => array_key_exists('is_active', $validated) ? $validated['is_active'] : $doctor->is_active,
                'notes' => array_key_exists('notes', $validated) ? $validated['notes'] : $doctor->notes,
            ]);
        });

        $freshDoctor = $doctor->fresh();

        $activityLogService->log(
            optional($request->user())->id,
            'doctor_updated',
            'doctor',
            $doctor->id,
            'Doctor Updated',
            'Doctor data was updated.',
            $oldDoctorData,
            [
                'department_id' => $freshDoctor->department_id,
                'academic_title' => $freshDoctor->academic_title,
                'employee_number' => $freshDoctor->employee_number,
                'is_active' => $freshDoctor->is_active,
                'notes' => $freshDoctor->notes,
            ],
            null,
            $request
        );

        return response()->json([
            'message' => 'Doctor updated successfully.',
            'data' => $freshDoctor->load(['user', 'department', 'courseAssignments.course', 'courseAssignments.academicYear']),
        ]);
    }

    public function destroy(
        Request $request,
        int $doctorId,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $doctor = Doctor::findOrFail($doctorId);

        if ($doctor->courseAssignments()->exists()) {
            return response()->json([
                'message' => 'Cannot delete doctor because they have course assignments.',
            ], 422);
        }

        $oldDoctorData = [
            'doctor_id' => $doctor->id,
            'user_id' => $doctor->user_id,
            'department_id' => $doctor->department_id,
            'academic_title' => $doctor->academic_title,
            'employee_number' => $doctor->employee_number,
        ];

        $doctor->delete();

        $activityLogService->log(
            optional($request->user())->id,
            'doctor_deleted',
            'doctor',
            $oldDoctorData['doctor_id'],
            'Doctor Deleted',
            'Doctor account was deleted.',
            $oldDoctorData,
            null,
            null,
            $request
        );

        return response()->json([
            'message' => 'Doctor deleted successfully.',
        ]);
    }
}
