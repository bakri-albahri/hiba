<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentAcademicRecord;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentFinanceStatusController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();

        $student = Student::with(['user', 'program', 'specialization'])
            ->where('user_id', $user->id)
            ->first();

        if (!$student) {
            return response()->json([
                'message' => 'This account is not linked to a student profile.',
            ], 404);
        }

        $currentRecord = StudentAcademicRecord::with(['academicYear', 'studyYear'])
            ->where('student_id', $student->id)
            ->whereHas('academicYear', function ($query) {
                $query->where('is_current', true);
            })
            ->latest('id')
            ->first();

        if (!$currentRecord) {
            $currentRecord = StudentAcademicRecord::with(['academicYear', 'studyYear'])
                ->where('student_id', $student->id)
                ->latest('id')
                ->first();
        }

        $tuitionFee = null;

        if ($currentRecord) {
            try {
                $tuitionFee = DB::table('tuition_fees')
                    ->where('program_id', $student->program_id)
                    ->where('academic_year_id', $currentRecord->academic_year_id)
                    ->where('study_year_id', $currentRecord->study_year_id)
                    ->where('is_active', true)
                    ->first();
            } catch (\Throwable $e) {
                $tuitionFee = null;
            }
        }

        $tuitionAmount = $tuitionFee?->amount;
        $tuitionPaid = (bool) ($currentRecord?->tuition_paid ?? false);

        return response()->json([
            'student_id' => $student->id,
            'student_number' => $student->student_number,
            'finance_status' => [
                'student_id' => $student->id,
                'student_number' => $student->student_number,
                'academic_record_id' => $currentRecord?->id,
                'academic_year' => $currentRecord?->academicYear,
                'study_year' => $currentRecord?->studyYear,
                'registration_status' => $currentRecord?->registration_status,
                'tuition_paid' => $tuitionPaid,
                'payment_receipt_number' => $currentRecord?->payment_receipt_number,
                'payment_receipt_date' => $currentRecord?->payment_receipt_date,
                'tuition_amount' => $tuitionAmount,
                'paid_amount' => $tuitionPaid ? $tuitionAmount : null,
                'remaining_amount' => $tuitionPaid ? 0 : $tuitionAmount,
                'currency' => 'USD',
                'tuition_fee' => $tuitionFee,
            ],
        ]);
    }
}
