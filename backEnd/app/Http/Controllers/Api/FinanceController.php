<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentAcademicRecord;
use App\Models\TuitionFee;
use App\Services\ActivityLogService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FinanceController extends Controller
{
    public function listTuitionFees(): JsonResponse
    {
        $fees = TuitionFee::with(['program', 'academicYear', 'studyYear'])
            ->latest()
            ->get();

        return response()->json($fees);
    }

    public function createOrUpdateTuitionFee(
        Request $request,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $validated = $request->validate([
            'program_id' => ['required', 'exists:programs,id'],
            'academic_year_id' => ['required', 'exists:academic_years,id'],
            'study_year_id' => ['required', 'exists:study_years,id'],
            'amount' => ['required', 'numeric', 'min:0'],
            'is_active' => ['nullable', 'boolean'],
            'notes' => ['nullable', 'string'],
        ]);

        $existingFee = TuitionFee::where('program_id', $validated['program_id'])
            ->where('academic_year_id', $validated['academic_year_id'])
            ->where('study_year_id', $validated['study_year_id'])
            ->first();

        $oldValues = $existingFee ? [
            'program_id' => $existingFee->program_id,
            'academic_year_id' => $existingFee->academic_year_id,
            'study_year_id' => $existingFee->study_year_id,
            'amount' => $existingFee->amount,
            'is_active' => $existingFee->is_active,
            'notes' => $existingFee->notes,
        ] : null;

        $fee = TuitionFee::updateOrCreate(
            [
                'program_id' => $validated['program_id'],
                'academic_year_id' => $validated['academic_year_id'],
                'study_year_id' => $validated['study_year_id'],
            ],
            [
                'amount' => $this->normalizeMoneyAmount($validated['amount']),
                'is_active' => $validated['is_active'] ?? true,
                'notes' => $validated['notes'] ?? null,
            ]
        );

        $activityLogService->log(
            optional($request->user())->id,
            'tuition_fee_saved',
            'tuition_fee',
            $fee->id,
            'Tuition Fee Saved',
            'Tuition fee was created or updated.',
            $oldValues,
            [
                'program_id' => $fee->program_id,
                'academic_year_id' => $fee->academic_year_id,
                'study_year_id' => $fee->study_year_id,
                'amount' => $fee->amount,
                'is_active' => $fee->is_active,
                'notes' => $fee->notes,
            ],
            null,
            $request
        );

        return response()->json([
            'message' => 'Tuition fee saved successfully.',
            'data' => $fee->load(['program', 'academicYear', 'studyYear']),
        ], 201);
    }

    public function showStudentFinance(int $studentId): JsonResponse
    {
        $student = Student::with([
            'user',
            'program',
            'specialization',
            'academicRecords.academicYear',
            'academicRecords.studyYear',
        ])->findOrFail($studentId);

        $records = $student->academicRecords->map(function ($record) use ($student) {
            $fee = TuitionFee::where('program_id', $student->program_id)
                ->where('academic_year_id', $record->academic_year_id)
                ->where('study_year_id', $record->study_year_id)
                ->first();

            return [
                'record_id' => $record->id,
                'academic_year' => $record->academicYear?->name,
                'study_year' => $record->studyYear?->name,
                'registration_status' => $record->registration_status,
                'academic_result' => $record->academic_result,
                'tuition_paid' => $record->tuition_paid,
                'payment_receipt_number' => $record->payment_receipt_number,
                'payment_receipt_date' => $record->payment_receipt_date,
                'tuition_fee' => $fee,
            ];
        })->values();

        return response()->json([
            'student' => [
                'id' => $student->id,
                'student_number' => $student->student_number,
                'program_id' => $student->program_id,
                'program_name' => $student->program?->name,
                'specialization_id' => $student->specialization_id,
                'specialization_name' => $student->specialization?->name,
                'is_active_registration' => $student->is_active_registration,
                'is_exhausted' => $student->is_exhausted,
            ],
            'finance_records' => $records,
        ]);
    }

    public function updateStudentTuitionStatus(
        Request $request,
        int $studentAcademicRecordId,
        NotificationService $notificationService,
        ActivityLogService $activityLogService
    ): JsonResponse {
        $record = StudentAcademicRecord::with(['student.user', 'academicYear', 'studyYear'])->findOrFail($studentAcademicRecordId);

        $validated = $request->validate([
            'tuition_paid' => ['required', 'boolean'],
            'payment_receipt_number' => ['nullable', 'string', 'max:255'],
            'payment_receipt_date' => ['nullable', 'date'],
            'notes' => ['nullable', 'string'],
        ]);

        if ($validated['tuition_paid'] === true) {
            if (empty($validated['payment_receipt_number']) || empty($validated['payment_receipt_date'])) {
                return response()->json([
                    'message' => 'Receipt number and receipt date are required when confirming tuition payment.',
                ], 422);
            }
        }

        $oldValues = [
            'tuition_paid' => $record->tuition_paid,
            'registration_status' => $record->registration_status,
            'payment_receipt_number' => $record->payment_receipt_number,
            'payment_receipt_date' => $record->payment_receipt_date,
            'notes' => $record->notes,
        ];

        $newRegistrationStatus = $record->registration_status;

        if ($validated['tuition_paid']) {
            $newRegistrationStatus = $record->student?->is_active_registration ? 'registered' : 'stopped';
        } else {
            $newRegistrationStatus = $record->student?->is_active_registration ? 'not_registered' : 'stopped';
        }

        $record->update([
            'tuition_paid' => $validated['tuition_paid'],
            'registration_status' => $newRegistrationStatus,
            'payment_receipt_number' => $validated['tuition_paid']
                ? $validated['payment_receipt_number']
                : null,
            'payment_receipt_date' => $validated['tuition_paid']
                ? $validated['payment_receipt_date']
                : null,
            'notes' => $validated['notes'] ?? $record->notes,
        ]);

        $notificationService->sendToStudent(
            $record->student,
            'tuition_payment_status_updated',
            $validated['tuition_paid'] ? 'Tuition Payment Confirmed' : 'Tuition Payment Pending',
            $validated['tuition_paid']
                ? 'Your tuition payment has been confirmed and your registration has been updated.'
                : 'Your tuition payment is not completed. Your registration may remain incomplete until payment is confirmed.',
            [
                'student_academic_record_id' => $record->id,
                'academic_year' => $record->academicYear?->name,
                'study_year' => $record->studyYear?->name,
                'tuition_paid' => $validated['tuition_paid'],
                'payment_receipt_number' => $record->payment_receipt_number,
                'payment_receipt_date' => $record->payment_receipt_date,
                'registration_status' => $record->registration_status,
            ]
        );

        $freshRecord = $record->fresh()->load(['student.user', 'academicYear', 'studyYear']);

        $activityLogService->log(
            optional($request->user())->id,
            'student_tuition_status_updated',
            'student_academic_record',
            $record->id,
            'Student Tuition Status Updated',
            'Student tuition payment status was updated.',
            $oldValues,
            [
                'tuition_paid' => $freshRecord->tuition_paid,
                'registration_status' => $freshRecord->registration_status,
                'payment_receipt_number' => $freshRecord->payment_receipt_number,
                'payment_receipt_date' => $freshRecord->payment_receipt_date,
                'notes' => $freshRecord->notes,
            ],
            [
                'student_id' => $record->student_id,
            ],
            $request
        );

        return response()->json([
            'message' => 'Student tuition payment status updated successfully.',
            'data' => $freshRecord,
        ]);
    }

    public function listStudentsFinancialStatus(): JsonResponse
    {
        $records = StudentAcademicRecord::with([
            'student.user',
            'student.program',
            'academicYear',
            'studyYear',
        ])->latest()->get();

        $result = $records->map(function ($record) {
            $fee = TuitionFee::where('program_id', $record->student->program_id)
                ->where('academic_year_id', $record->academic_year_id)
                ->where('study_year_id', $record->study_year_id)
                ->first();

            return [
                'student_academic_record_id' => $record->id,
                'student_id' => $record->student_id,
                'student_name' => $record->student?->user?->full_name,
                'student_number' => $record->student?->student_number,
                'program' => $record->student?->program?->name,
                'academic_year' => $record->academicYear?->name,
                'study_year' => $record->studyYear?->name,
                'registration_status' => $record->registration_status,
                'tuition_paid' => $record->tuition_paid,
                'payment_receipt_number' => $record->payment_receipt_number,
                'payment_receipt_date' => $record->payment_receipt_date,
                'tuition_amount' => $fee?->amount,
            ];
        })->values();

        return response()->json($result);
    }
    private function normalizeMoneyAmount($amount): string
    {
        $value = trim((string) $amount);
        $value = str_replace([',', ' '], '', $value);

        if (!preg_match('/^\d+(\.\d{1,2})?$/', $value)) {
            throw \Illuminate\Validation\ValidationException::withMessages([
                'amount' => ['The amount must be a valid money value with up to 2 decimal places.'],
            ]);
        }

        [$integerPart, $decimalPart] = array_pad(explode('.', $value, 2), 2, '00');

        $integerPart = ltrim($integerPart, '0');
        if ($integerPart === '') {
            $integerPart = '0';
        }

        $decimalPart = substr(str_pad($decimalPart, 2, '0'), 0, 2);

        return $integerPart . '.' . $decimalPart;
    }
}