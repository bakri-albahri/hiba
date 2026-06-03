<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcademicYear;
use App\Models\ClassSchedule;
use App\Models\CourseMaterial;
use App\Models\ExamSchedule;
use App\Models\GradeObjection;
use App\Models\Student;
use App\Models\StudentCourseEnrollment;
use App\Models\StudentCourseGrade;
use App\Models\StudentServiceRequest;
use App\Models\StudentDocument;
use App\Models\SupplementaryExamRequest;
use App\Models\SupplementaryExamSchedule;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class StudentPortalController extends Controller
{
    private function authenticatedStudent(Request $request): ?Student
    {
        return $request->user()?->student;
    }

    private function studentOnlyResponse(): JsonResponse
    {
        return response()->json([
            'message' => 'Only authenticated student accounts can access this endpoint.',
        ], 403);
    }

    public function profile(Request $request): JsonResponse
    {
        $student = $this->authenticatedStudent($request);

        if (!$student) {
            return $this->studentOnlyResponse();
        }

        $user = $request->user()->loadMissing([
            'student.program',
            'student.specialization',
        ]);

        $currentRecord = $student->academicRecords()
            ->with(['academicYear', 'studyYear'])
            ->orderByDesc('academic_year_id')
            ->orderByDesc('id')
            ->first();

        return response()->json([
            'user' => $user,
            'student' => $user->student,
            'current_academic_record' => $currentRecord,
        ]);
    }

    public function currentAcademicRecord(Request $request): JsonResponse
    {
        $student = $this->authenticatedStudent($request);

        if (!$student) {
            return $this->studentOnlyResponse();
        }

        $student->loadMissing(['user', 'program', 'specialization']);

        $currentRecord = $student->academicRecords()
            ->with(['academicYear', 'studyYear'])
            ->orderByDesc('academic_year_id')
            ->orderByDesc('id')
            ->first();

        if (!$currentRecord) {
            return response()->json([
                'message' => 'No academic record found for this student.',
            ], 404);
        }

        return response()->json([
            'student' => [
                'id' => $student->id,
                'student_number' => $student->student_number,
                'full_name' => $student->user?->full_name,
                'program_name' => $student->program?->name,
                'specialization_name' => $student->specialization?->name,
                'is_active_registration' => $student->is_active_registration,
                'is_exhausted' => $student->is_exhausted,
            ],
            'current_academic_record' => $currentRecord,
        ]);
    }

    public function academicSummary(Request $request): JsonResponse
    {
        $student = $this->authenticatedStudent($request);

        if (!$student) {
            return $this->studentOnlyResponse();
        }

        $student->loadMissing(['user', 'program', 'specialization']);

        $currentRecord = $student->academicRecords()
            ->with(['academicYear', 'studyYear'])
            ->orderByDesc('academic_year_id')
            ->orderByDesc('id')
            ->first();

        if (!$currentRecord) {
            return response()->json([
                'message' => 'No academic record found for this student.',
            ], 404);
        }

        $resultLabel = match ($currentRecord->academic_result) {
            'passed' => 'passed',
            'promoted' => 'promoted',
            'failed' => 'failed',
            'exhausted' => 'exhausted',
            default => 'in_progress',
        };

        return response()->json([
            'student' => [
                'id' => $student->id,
                'student_number' => $student->student_number,
                'full_name' => $student->user?->full_name,
                'program_name' => $student->program?->name,
                'specialization_name' => $student->specialization?->name,
            ],
            'summary' => [
                'academic_year' => $currentRecord->academicYear?->name,
                'study_year' => $currentRecord->studyYear?->name,
                'registration_status' => $currentRecord->registration_status,
                'academic_result' => $currentRecord->academic_result,
                'result_label' => $resultLabel,
                'annual_average' => $currentRecord->annual_average,
                'carried_courses_count' => $currentRecord->carried_courses_count,
                'carried_courses_credit_sum' => $currentRecord->carried_courses_credit_sum,
                'tuition_paid' => $currentRecord->tuition_paid,
                'auto_promoted' => $currentRecord->auto_promoted,
                'consecutive_failures_in_same_year' => $currentRecord->consecutive_failures_in_same_year,
                'is_active_registration' => $student->is_active_registration,
                'is_exhausted' => $student->is_exhausted,
            ],
        ]);
    }

    public function grades(Request $request): JsonResponse
    {
        $student = $this->authenticatedStudent($request);

        if (!$student) {
            return $this->studentOnlyResponse();
        }

        $student->loadMissing(['user', 'program', 'specialization']);

        $enrollments = StudentCourseEnrollment::with([
            'course',
            'academicYear',
            'studyYear',
            'grade',
        ])
            ->where('student_id', $student->id)
            ->orderByDesc('academic_year_id')
            ->orderBy('study_year_id')
            ->orderBy('semester_number')
            ->orderBy('course_id')
            ->get();

        return response()->json([
            'student' => [
                'id' => $student->id,
                'student_number' => $student->student_number,
                'full_name' => $student->user?->full_name,
                'program_name' => $student->program?->name,
                'specialization_name' => $student->specialization?->name,
            ],
            'grades_count' => $enrollments->count(),
            'grades' => $enrollments->map(function ($enrollment) {
                return $this->formatEnrollmentGradeRow($enrollment);
            })->values(),
        ]);
    }

    public function gradeObjections(Request $request): JsonResponse
    {
        $student = $this->authenticatedStudent($request);

        if (!$student) {
            return $this->studentOnlyResponse();
        }

        $objections = GradeObjection::with([
            'enrollment.course',
            'enrollment.academicYear',
            'enrollment.studyYear',
            'enrollment.grade',
        ])
            ->where('student_id', $student->id)
            ->latest()
            ->get();

        return response()->json([
            'student' => $student->only(['id', 'student_number']),
            'grade_objections_count' => $objections->count(),
            'grade_objections' => $objections->map(function (GradeObjection $objection) {
                $enrollment = $objection->enrollment;

                return [
                    'id' => $objection->id,
                    'student_id' => $objection->student_id,
                    'student_course_enrollment_id' => $objection->student_course_enrollment_id,
                    'enrollment_id' => $objection->student_course_enrollment_id,
                    'course_id' => $enrollment?->course_id,
                    'course_name' => $enrollment?->course?->name,
                    'course_code' => $enrollment?->course?->code,
                    'academic_year' => $enrollment?->academicYear?->name,
                    'study_year' => $enrollment?->studyYear?->name,
                    'semester_number' => $enrollment?->semester_number,
                    'grade' => $this->formatGradePayload($enrollment?->grade),
                    'objection_text' => $objection->objection_text,
                    'objection_target' => $objection->objection_target,
                    'status' => $objection->status,
                    'exam_department_note' => $objection->exam_department_note,
                    'doctor_response' => $objection->doctor_response,
                    'doctor_suggested_coursework_mark' => $objection->doctor_suggested_coursework_mark,
                    'doctor_suggested_practical_mark' => $objection->doctor_suggested_practical_mark,
                    'doctor_suggested_exam_mark' => $objection->doctor_suggested_exam_mark,
                    'final_exam_decision_note' => $objection->final_exam_decision_note,
                    'submitted_at' => $objection->submitted_at,
                    'created_at' => $objection->created_at,
                    'updated_at' => $objection->updated_at,
                ];
            })->values(),
        ]);
    }

    public function attendance(Request $request): JsonResponse
    {
        $student = $this->authenticatedStudent($request);

        if (!$student) {
            return $this->studentOnlyResponse();
        }

        $student->loadMissing([
            'user',
            'courseEnrollments.course',
            'courseEnrollments.attendanceRecords.doctor.user',
        ]);

        // Return a flat list of attendance records because the React portal calculates
        // attendance risk per course from individual session records.
        $attendance = $student->courseEnrollments
            ->flatMap(function ($enrollment) {
                return $enrollment->attendanceRecords->map(function ($record) use ($enrollment) {
                    return [
                        'id' => $record->id,
                        'student_course_enrollment_id' => $enrollment->id,
                        'enrollment_id' => $enrollment->id,
                        'course_id' => $enrollment->course_id,
                        'course_name' => $enrollment->course?->name,
                        'course_code' => $enrollment->course?->code,
                        'course' => $enrollment->course,
                        'attendance_date' => $record->attendance_date,
                        'status' => $record->status ?? 'present',
                        'note' => $record->note ?? null,
                        'recorded_at' => $record->recorded_at,
                        'created_at' => $record->created_at,
                        'updated_at' => $record->updated_at,
                        'doctor' => $record->doctor?->user?->full_name,
                    ];
                });
            })
            ->sortByDesc(fn ($record) => $record['attendance_date'] ?? $record['created_at'] ?? null)
            ->values();

        return response()->json([
            'student' => $student->only(['id', 'student_number']),
            'attendance_count' => $attendance->count(),
            'attendance' => $attendance,
        ]);
    }


    public function officialDocuments(Request $request): JsonResponse
    {
        $student = $this->authenticatedStudent($request);

        if (!$student) {
            return $this->studentOnlyResponse();
        }

        $student->loadMissing(['user', 'program', 'specialization']);

        $currentRecord = $student->academicRecords()
            ->with(['academicYear', 'studyYear'])
            ->orderByDesc('academic_year_id')
            ->orderByDesc('id')
            ->first();

        $recordedGradesCount = StudentCourseEnrollment::query()
            ->where('student_id', $student->id)
            ->whereHas('grade', function ($query) {
                $query->whereNotNull('last_updated_at')
                    ->orWhereIn('result_status', [
                        'passed',
                        'failed',
                        'carried',
                        'conditionally_passed',
                        'supplementary_approved',
                    ]);
            })
            ->count();

        $examItemsCount = ExamSchedule::query()
            ->when($currentRecord, function ($query) use ($currentRecord) {
                $query->where('academic_year_id', $currentRecord->academic_year_id);
            })
            ->whereIn('course_id', function ($query) use ($student, $currentRecord) {
                $query->select('course_id')
                    ->from('student_course_enrollments')
                    ->where('student_id', $student->id)
                    ->when($currentRecord, function ($query) use ($currentRecord) {
                        $query->where('academic_year_id', $currentRecord->academic_year_id);
                    });
            })
            ->count();

        $activeRequests = StudentServiceRequest::query()
            ->where('student_id', $student->id)
            ->whereIn('status', ['submitted', 'under_review', 'approved'])
            ->get()
            ->groupBy('request_type');

        $isActive = (bool) $student->is_active_registration && !$student->is_exhausted;
        $isRegistered = $currentRecord?->registration_status === 'registered';
        $tuitionPaid = (bool) ($currentRecord?->tuition_paid ?? false);
        $hasCurrentRecord = (bool) $currentRecord;

        $unofficialTranscriptDocument = $this->ensureStudentDocument(
            $student,
            'unofficial_transcript',
            'Unofficial Transcript',
            $currentRecord,
            $request->user()?->id,
            [
                'academic_year' => $currentRecord?->academicYear?->name,
                'study_year' => $currentRecord?->studyYear?->name,
                'recorded_grades_count' => $recordedGradesCount,
            ]
        );

        $examCardDocument = $this->ensureStudentDocument(
            $student,
            'exam_card',
            'Exam Card',
            $currentRecord,
            $request->user()?->id,
            [
                'academic_year' => $currentRecord?->academicYear?->name,
                'exam_items_count' => $examItemsCount,
            ]
        );

        $documents = [
            $this->formatOfficialDocument([
                'id' => 'unofficial_transcript',
                'title' => 'Unofficial Transcript',
                'description' => 'Download a student-copy PDF of recorded grades from the portal.',
                'category' => 'Academic',
                'mode' => 'instant',
                'status' => $recordedGradesCount > 0 ? 'available' : 'limited',
                'available' => true,
                'icon' => 'fa-solid fa-file-pdf',
                'instant_action' => 'download_transcript',
                'reasons' => $recordedGradesCount > 0 ? [] : ['No recorded grades are available yet.'],
                'student_document' => $unofficialTranscriptDocument,
            ]),
            $this->formatOfficialDocument([
                'id' => 'exam_card',
                'title' => 'Exam Card',
                'description' => 'Download the latest exam card with eligibility checks and exam details.',
                'category' => 'Examinations',
                'mode' => 'instant',
                'status' => $examItemsCount > 0 ? 'available' : 'limited',
                'available' => true,
                'icon' => 'fa-solid fa-id-card-clip',
                'instant_action' => 'download_exam_card',
                'reasons' => $examItemsCount > 0 ? [] : ['No exam card items are available for the current academic year.'],
                'student_document' => $examCardDocument,
            ]),
            $this->formatOfficialDocument([
                'id' => 'official_transcript',
                'title' => 'Official Transcript / Grade Statement',
                'description' => 'Submit an official request for a certified grade statement.',
                'category' => 'Academic',
                'mode' => 'request',
                'status' => $isActive ? 'available' : 'blocked',
                'available' => $isActive,
                'icon' => 'fa-solid fa-file-lines',
                'request_type' => 'transcript_request',
                'default_subject' => 'Official transcript request',
                'default_description' => 'Please issue an official transcript / grade statement based on my recorded academic results.',
                'reasons' => $isActive ? [] : ['Student registration is inactive or exhausted.'],
                'active_request_id' => optional($activeRequests->get('transcript_request')?->first())->id,
            ]),
            $this->formatOfficialDocument([
                'id' => 'enrollment_certificate',
                'title' => 'Enrollment Certificate',
                'description' => 'Request an official proof of enrollment for the current academic year.',
                'category' => 'Administrative',
                'mode' => 'request',
                'status' => ($isActive && $isRegistered) ? 'available' : 'limited',
                'available' => $isActive && $hasCurrentRecord,
                'icon' => 'fa-solid fa-id-card',
                'request_type' => 'enrollment_certificate',
                'default_subject' => 'Enrollment certificate request',
                'default_description' => 'Please issue an official enrollment certificate for my current academic year.',
                'reasons' => $isRegistered ? [] : ['Registration status is not fully registered yet.'],
                'active_request_id' => optional($activeRequests->get('enrollment_certificate')?->first())->id,
            ]),
            $this->formatOfficialDocument([
                'id' => 'official_attendance_statement',
                'title' => 'Official Attendance Statement',
                'description' => 'Request an official statement of attendance for enrolled courses.',
                'category' => 'Attendance',
                'mode' => 'request',
                'status' => $isActive ? 'available' : 'blocked',
                'available' => $isActive,
                'icon' => 'fa-solid fa-user-check',
                'request_type' => 'official_attendance_statement',
                'default_subject' => 'Official attendance statement request',
                'default_description' => 'Please issue an official attendance statement for my current enrolled courses.',
                'reasons' => $isActive ? [] : ['Student account is not eligible for official document requests.'],
                'active_request_id' => optional($activeRequests->get('official_attendance_statement')?->first())->id,
            ]),
            $this->formatOfficialDocument([
                'id' => 'course_description_request',
                'title' => 'Course Description',
                'description' => 'Request official course descriptions for equivalency, transfer, or scholarship use.',
                'category' => 'Academic',
                'mode' => 'request',
                'status' => $isActive ? 'available' : 'blocked',
                'available' => $isActive,
                'icon' => 'fa-solid fa-book-open',
                'request_type' => 'course_description_request',
                'default_subject' => 'Course description request',
                'default_description' => 'Please provide official course descriptions for the courses I will list in this request.',
                'reasons' => $isActive ? [] : ['Student account is not eligible for official document requests.'],
                'active_request_id' => optional($activeRequests->get('course_description_request')?->first())->id,
            ]),
            $this->formatOfficialDocument([
                'id' => 'clearance_request',
                'title' => 'University Clearance',
                'description' => 'Start an official clearance workflow for graduation, withdrawal, or administrative needs.',
                'category' => 'Administrative',
                'mode' => 'request',
                'status' => $tuitionPaid ? 'available' : 'limited',
                'available' => $isActive,
                'icon' => 'fa-solid fa-clipboard-check',
                'request_type' => 'clearance_request',
                'default_subject' => 'University clearance request',
                'default_description' => 'Please start my university clearance request and confirm the required steps with the relevant departments.',
                'reasons' => $tuitionPaid ? [] : ['Financial clearance may be required before final approval.'],
                'active_request_id' => optional($activeRequests->get('clearance_request')?->first())->id,
            ]),
            $this->formatOfficialDocument([
                'id' => 'student_card_replacement',
                'title' => 'Student Card Replacement',
                'description' => 'Request a replacement for a lost or damaged university student card.',
                'category' => 'Administrative',
                'mode' => 'request',
                'status' => $isActive ? 'available' : 'blocked',
                'available' => $isActive,
                'icon' => 'fa-solid fa-address-card',
                'request_type' => 'student_card_replacement',
                'default_subject' => 'Student card replacement request',
                'default_description' => 'Please process my request for a replacement student card. I will provide any required details or attachments.',
                'fee_required' => true,
                'reasons' => $isActive ? [] : ['Student account is not eligible for official document requests.'],
                'active_request_id' => optional($activeRequests->get('student_card_replacement')?->first())->id,
            ]),
            $this->formatOfficialDocument([
                'id' => 'graduation_certificate',
                'title' => 'Graduation Certificate',
                'description' => 'Request a graduation certificate after academic completion.',
                'category' => 'Graduation',
                'mode' => 'request',
                'status' => in_array($currentRecord?->academic_result, ['passed', 'promoted'], true) ? 'available' : 'limited',
                'available' => $isActive,
                'icon' => 'fa-solid fa-graduation-cap',
                'request_type' => 'graduation_certificate',
                'default_subject' => 'Graduation certificate request',
                'default_description' => 'Please review my eligibility and issue a graduation certificate if all academic and administrative requirements are complete.',
                'reasons' => in_array($currentRecord?->academic_result, ['passed', 'promoted'], true) ? [] : ['Graduation eligibility must be confirmed by the examinations department.'],
                'active_request_id' => optional($activeRequests->get('graduation_certificate')?->first())->id,
            ]),
        ];

        return response()->json([
            'student' => [
                'id' => $student->id,
                'student_number' => $student->student_number,
                'full_name' => $student->user?->full_name,
                'program_name' => $student->program?->name,
                'specialization_name' => $student->specialization?->name,
            ],
            'academic_year' => $currentRecord?->academicYear,
            'documents' => $documents,
            'summary' => [
                'total_documents' => count($documents),
                'instant_documents' => collect($documents)->where('mode', 'instant')->count(),
                'request_documents' => collect($documents)->where('mode', 'request')->count(),
                'limited_documents' => collect($documents)->filter(fn ($document) => in_array($document['status'], ['limited', 'blocked'], true))->count(),
            ],
        ]);
    }

    public function verifyDocument(string $verificationCode): JsonResponse
    {
        $document = StudentDocument::with(['student.user', 'student.program', 'student.specialization', 'academicYear'])
            ->where('verification_code', strtoupper($verificationCode))
            ->first();

        if (!$document) {
            return response()->json([
                'valid' => false,
                'status' => 'not_found',
                'message' => 'Document verification code was not found.',
            ], 404);
        }

        $isExpired = $document->expires_at && $document->expires_at->isPast();
        $status = $isExpired ? 'expired' : $document->status;
        $valid = $status === 'valid';

        return response()->json([
            'valid' => $valid,
            'status' => $status,
            'verification_code' => $document->verification_code,
            'document_type' => $document->document_type,
            'document_title' => $document->document_title,
            'issued_at' => optional($document->issued_at)->toDateTimeString(),
            'expires_at' => optional($document->expires_at)->toDateTimeString(),
            'student' => [
                'student_number' => $document->student?->student_number,
                'full_name' => $document->student?->user?->full_name,
                'program_name' => $document->student?->program?->name,
                'specialization_name' => $document->student?->specialization?->name,
            ],
            'academic_year' => $document->academicYear?->name,
            'metadata' => $document->metadata ?? [],
            'message' => $valid
                ? 'Document is valid and was issued by the student portal.'
                : 'Document exists but is not currently valid.',
        ]);
    }

    public function paymentHistory(Request $request): JsonResponse
    {
        $student = $this->authenticatedStudent($request);

        if (!$student) {
            return $this->studentOnlyResponse();
        }

        $student->loadMissing(['user', 'program', 'specialization']);

        $records = $student->academicRecords()
            ->with(['academicYear', 'studyYear'])
            ->orderByDesc('academic_year_id')
            ->orderByDesc('id')
            ->get();

        $currentRecordId = optional($records->first())->id;

        $paymentHistory = $records->map(function ($record) use ($currentRecordId) {
            $tuitionAmount = $record->tuition_amount ?? null;
            $paidAmount = null;
            $remainingAmount = null;

            if ($tuitionAmount !== null) {
                $paidAmount = $record->tuition_paid ? $tuitionAmount : 0;
                $remainingAmount = $record->tuition_paid ? 0 : $tuitionAmount;
            }

            return [
                'id' => $record->id,
                'academic_record_id' => $record->id,
                'academic_year_id' => $record->academic_year_id,
                'academic_year' => $record->academicYear?->name,
                'study_year_id' => $record->study_year_id,
                'study_year' => $record->studyYear?->name,
                'registration_status' => $record->registration_status,
                'academic_result' => $record->academic_result,
                'tuition_paid' => (bool) $record->tuition_paid,
                'payment_status' => $record->tuition_paid ? 'paid' : 'unpaid',
                'tuition_amount' => $tuitionAmount,
                'paid_amount' => $paidAmount,
                'remaining_amount' => $remainingAmount,
                'currency' => 'USD',
                'receipt_number' => $record->payment_receipt_number,
                'receipt_date' => $record->payment_receipt_date,
                'notes' => $record->notes,
                'is_current' => $record->id === $currentRecordId,
                'created_at' => $record->created_at,
                'updated_at' => $record->updated_at,
            ];
        })->values();

        $paidRecords = $paymentHistory->filter(fn ($row) => (bool) $row['tuition_paid']);

        return response()->json([
            'student' => [
                'id' => $student->id,
                'student_number' => $student->student_number,
                'full_name' => $student->user?->full_name,
                'program_name' => $student->program?->name,
                'specialization_name' => $student->specialization?->name,
            ],
            'summary' => [
                'records_count' => $paymentHistory->count(),
                'paid_records_count' => $paidRecords->count(),
                'unpaid_records_count' => $paymentHistory->count() - $paidRecords->count(),
                'last_payment_date' => $paidRecords
                    ->pluck('receipt_date')
                    ->filter()
                    ->sortDesc()
                    ->first(),
            ],
            'payment_history' => $paymentHistory,
            'payments' => $paymentHistory,
        ]);
    }


    public function academicCalendar(Request $request): JsonResponse
    {
        $student = $this->authenticatedStudent($request);

        if (!$student) {
            return $this->studentOnlyResponse();
        }

        $student->loadMissing(['user', 'program', 'specialization']);

        $currentRecord = $student->academicRecords()
            ->with(['academicYear', 'studyYear'])
            ->orderByDesc('academic_year_id')
            ->orderByDesc('id')
            ->first();

        if (!$currentRecord) {
            return response()->json([
                'message' => 'No academic record found for this student.',
            ], 404);
        }

        $academicYear = $currentRecord->academicYear;

        $enrollments = $student->courseEnrollments()
            ->with(['course', 'academicYear', 'studyYear'])
            ->where('academic_year_id', $currentRecord->academic_year_id)
            ->get();

        $courseIds = $enrollments->pluck('course_id')->filter()->unique()->values();

        $events = collect();
        $deadlines = collect();

        if ($academicYear?->start_date) {
            $events->push($this->formatCalendarItem([
                'id' => 'academic-year-start-' . $academicYear->id,
                'type' => 'academic_year_start',
                'title' => 'Academic year starts',
                'description' => $academicYear->name,
                'date' => $academicYear->start_date,
                'end_date' => $academicYear->end_date,
                'badge' => 'Academic Year',
                'icon' => 'fa-solid fa-flag-checkered',
            ]));
        }

        if ($academicYear?->end_date) {
            $events->push($this->formatCalendarItem([
                'id' => 'academic-year-end-' . $academicYear->id,
                'type' => 'academic_year_end',
                'title' => 'Academic year ends',
                'description' => $academicYear->name,
                'date' => $academicYear->end_date,
                'badge' => 'Academic Year',
                'icon' => 'fa-solid fa-flag',
            ]));
        }

        $regularExams = ExamSchedule::with(['course', 'academicYear'])
            ->where('academic_year_id', $currentRecord->academic_year_id)
            ->when(
                $courseIds->isNotEmpty(),
                fn ($query) => $query->whereIn('course_id', $courseIds),
                fn ($query) => $query->whereRaw('1 = 0')
            )
            ->orderBy('exam_date')
            ->get();

        $regularExams->each(function (ExamSchedule $exam) use ($events) {
            $events->push($this->formatCalendarItem([
                'id' => 'regular-exam-' . $exam->id,
                'type' => 'regular_exam',
                'title' => 'Regular exam: ' . ($exam->course?->name ?? 'Course'),
                'description' => trim(($exam->course?->code ? $exam->course->code . ' • ' : '') . 'Room ' . ($exam->exam_room ?? 'Not assigned')),
                'date' => $exam->exam_date,
                'badge' => 'Regular Exam',
                'icon' => 'fa-solid fa-calendar-days',
                'meta' => [
                    'course_id' => $exam->course_id,
                    'course_code' => $exam->course?->code,
                    'course_name' => $exam->course?->name,
                    'room' => $exam->exam_room,
                ],
            ]));
        });

        $supplementaryRequests = SupplementaryExamRequest::with(['enrollment.course'])
            ->where('student_id', $student->id)
            ->where('academic_year_id', $currentRecord->academic_year_id)
            ->get();

        $approvedSupplementaryCourseIds = $supplementaryRequests
            ->filter(fn ($request) => in_array($request->status, ['approved', 'completed'], true))
            ->pluck('enrollment.course_id')
            ->filter()
            ->unique()
            ->values();

        $supplementaryExams = SupplementaryExamSchedule::with(['course', 'academicYear'])
            ->where('academic_year_id', $currentRecord->academic_year_id)
            ->when(
                $approvedSupplementaryCourseIds->isNotEmpty(),
                fn ($query) => $query->whereIn('course_id', $approvedSupplementaryCourseIds),
                fn ($query) => $query->whereRaw('1 = 0')
            )
            ->orderBy('exam_date')
            ->get();

        $supplementaryExams->each(function (SupplementaryExamSchedule $exam) use ($events) {
            $events->push($this->formatCalendarItem([
                'id' => 'supplementary-exam-' . $exam->id,
                'type' => 'supplementary_exam',
                'title' => 'Supplementary exam: ' . ($exam->course?->name ?? 'Course'),
                'description' => trim(($exam->course?->code ? $exam->course->code . ' • ' : '') . 'Room ' . ($exam->exam_room ?? 'Not assigned')),
                'date' => $exam->exam_date,
                'badge' => 'Supplementary',
                'icon' => 'fa-solid fa-file-circle-check',
                'meta' => [
                    'course_id' => $exam->course_id,
                    'course_code' => $exam->course?->code,
                    'course_name' => $exam->course?->name,
                    'room' => $exam->exam_room,
                ],
            ]));
        });

        $nextExamDate = $regularExams
            ->concat($supplementaryExams)
            ->pluck('exam_date')
            ->filter(fn ($date) => $date && Carbon::parse($date)->greaterThanOrEqualTo(now()->startOfDay()))
            ->sort()
            ->first();

        if (!$currentRecord->tuition_paid || $currentRecord->registration_status !== 'registered') {
            $deadlines->push($this->formatCalendarItem([
                'id' => 'financial-clearance-deadline',
                'type' => 'financial_clearance',
                'title' => 'Financial clearance required',
                'description' => 'Review tuition payment and registration status before exam entry.',
                'date' => $nextExamDate ?: $academicYear?->end_date,
                'badge' => 'Finance',
                'icon' => 'fa-solid fa-wallet',
                'action_tab' => 'finance',
            ]));
        }

        $activeObjections = GradeObjection::where('student_id', $student->id)
            ->whereIn('status', ['submitted', 'under_review', 'sent_to_doctor', 'doctor_responded'])
            ->latest()
            ->get();

        $activeObjections->each(function (GradeObjection $objection) use ($deadlines) {
            $baseDate = $objection->submitted_at ?: $objection->created_at;
            $deadlines->push($this->formatCalendarItem([
                'id' => 'grade-objection-follow-up-' . $objection->id,
                'type' => 'grade_objection_follow_up',
                'title' => 'Grade objection follow-up',
                'description' => 'Track your submitted grade objection until the final decision is recorded.',
                'date' => $baseDate ? Carbon::parse($baseDate)->addDays(7) : null,
                'badge' => 'Objection',
                'icon' => 'fa-solid fa-scale-balanced',
                'action_tab' => 'objections',
            ]));
        });

        $supplementaryRequests
            ->filter(fn ($request) => in_array($request->status, ['submitted', 'under_review'], true))
            ->each(function (SupplementaryExamRequest $request) use ($deadlines) {
                $deadlines->push($this->formatCalendarItem([
                    'id' => 'supplementary-registration-follow-up-' . $request->id,
                    'type' => 'supplementary_registration',
                    'title' => 'Supplementary request follow-up',
                    'description' => 'Follow your supplementary exam request status before schedules are finalized.',
                    'date' => $request->created_at ? Carbon::parse($request->created_at)->addDays(5) : null,
                    'badge' => 'Supplementary',
                    'icon' => 'fa-solid fa-file-signature',
                    'action_tab' => 'supplementary',
                ]));
            });

        StudentServiceRequest::where('student_id', $student->id)
            ->whereIn('status', ['submitted', 'under_review'])
            ->latest()
            ->limit(5)
            ->get()
            ->each(function (StudentServiceRequest $serviceRequest) use ($deadlines) {
                $deadlines->push($this->formatCalendarItem([
                    'id' => 'service-request-follow-up-' . $serviceRequest->id,
                    'type' => 'service_request_follow_up',
                    'title' => 'Student service request follow-up',
                    'description' => $serviceRequest->subject ?: 'Follow your active student service request.',
                    'date' => $serviceRequest->created_at ? Carbon::parse($serviceRequest->created_at)->addDays(5) : null,
                    'badge' => 'Service Request',
                    'icon' => 'fa-solid fa-headset',
                    'action_tab' => 'services',
                ]));
            });

        $events = $events
            ->filter(fn ($event) => !empty($event['date']))
            ->sortBy(fn ($event) => $event['date'])
            ->values();

        $deadlines = $deadlines
            ->filter(fn ($deadline) => !empty($deadline['date']))
            ->sortBy(fn ($deadline) => $deadline['date'])
            ->values();

        return response()->json([
            'student' => [
                'id' => $student->id,
                'student_number' => $student->student_number,
                'full_name' => $student->user?->full_name,
                'program_name' => $student->program?->name,
                'specialization_name' => $student->specialization?->name,
            ],
            'academic_year' => $academicYear,
            'events' => $events,
            'deadlines' => $deadlines,
            'summary' => [
                'events_count' => $events->count(),
                'deadlines_count' => $deadlines->count(),
                'due_soon_count' => $deadlines->whereIn('status', ['due_soon', 'overdue'])->count(),
                'academic_year_name' => $academicYear?->name,
            ],
        ]);
    }


    public function graduationEligibility(Request $request): JsonResponse
    {
        $student = $this->authenticatedStudent($request);

        if (!$student) {
            return $this->studentOnlyResponse();
        }

        $student->loadMissing(['user', 'program', 'specialization']);

        $currentRecord = $student->academicRecords()
            ->with(['academicYear', 'studyYear'])
            ->orderByDesc('academic_year_id')
            ->orderByDesc('id')
            ->first();

        $enrollments = StudentCourseEnrollment::with(['course', 'grade', 'academicYear', 'studyYear'])
            ->where('student_id', $student->id)
            ->orderBy('study_year_id')
            ->orderBy('semester_number')
            ->orderBy('course_id')
            ->get();

        $courseMap = [];

        foreach ($enrollments as $enrollment) {
            $courseId = $enrollment->course_id ?: 'enrollment-' . $enrollment->id;
            $grade = $enrollment->grade;
            $status = strtolower((string) ($grade?->result_status ?: $enrollment->status ?: 'pending'));
            $finalMark = is_numeric($grade?->final_mark) ? (float) $grade->final_mark : null;
            $passMark = is_numeric($enrollment->course?->pass_mark) ? (float) $enrollment->course->pass_mark : 60.0;

            $isCompleted = in_array($status, ['passed', 'promoted', 'supplementary_approved', 'conditionally_passed'], true)
                || ($finalMark !== null && $finalMark >= $passMark);

            $isFailed = in_array($status, ['failed', 'carried'], true)
                || ($finalMark !== null && $finalMark > 0 && $finalMark < $passMark);

            $isCarried = (bool) $enrollment->is_carried || $status === 'carried';
            $isInProgress = !$isCompleted && !$isFailed && !$isCarried;

            $category = $isCompleted ? 'completed' : ($isCarried ? 'carried' : ($isFailed ? 'failed' : 'in_progress'));

            $row = [
                'id' => $enrollment->id,
                'enrollment_id' => $enrollment->id,
                'course_id' => $enrollment->course_id,
                'course_name' => $enrollment->course?->name,
                'course_code' => $enrollment->course?->code,
                'credit_hours' => (int) ($enrollment->course?->credit_hours ?? 0),
                'study_year' => $enrollment->studyYear?->name,
                'semester_number' => $enrollment->semester_number,
                'academic_year' => $enrollment->academicYear?->name,
                'final_mark' => $finalMark,
                'status' => $status,
                'category' => $category,
                'reason' => $category === 'completed' ? 'Completed course' : 'Course requires follow-up',
            ];

            if (!isset($courseMap[$courseId])) {
                $courseMap[$courseId] = $row;
                continue;
            }

            $currentPriority = $this->graduationCoursePriority($courseMap[$courseId]['category']);
            $newPriority = $this->graduationCoursePriority($category);

            if ($newPriority > $currentPriority || ($newPriority === $currentPriority && $enrollment->id > ($courseMap[$courseId]['enrollment_id'] ?? 0))) {
                $courseMap[$courseId] = $row;
            }
        }

        $courses = collect(array_values($courseMap));
        $completed = $courses->where('category', 'completed')->values();
        $carried = $courses->where('category', 'carried')->values();
        $failed = $courses->where('category', 'failed')->values();
        $inProgress = $courses->where('category', 'in_progress')->values();
        $remaining = $courses->reject(fn ($course) => $course['category'] === 'completed')->values();

        $totalCourses = $courses->count();
        $completedCourses = $completed->count();
        $completionPercentage = $totalCourses ? round(($completedCourses / $totalCourses) * 100) : 0;
        $totalCredits = (int) $courses->sum('credit_hours');
        $completedCredits = (int) $completed->sum('credit_hours');

        $academicPassed = $totalCourses > 0 && $remaining->count() === 0;
        $financialPassed = (bool) ($currentRecord?->tuition_paid) && (($currentRecord?->registration_status) === 'registered');
        $registrationPassed = (bool) $student->is_active_registration && !(bool) $student->is_exhausted;
        $eligible = $academicPassed && $financialPassed && $registrationPassed;

        $requirements = [
            [
                'key' => 'academic_completion',
                'title' => 'Academic completion',
                'passed' => $academicPassed,
                'status' => $academicPassed ? 'passed' : 'pending',
                'message' => $academicPassed ? 'All known study plan courses are completed.' : 'Some courses still need to be completed.',
                'icon' => 'fa-solid fa-book-open-reader',
                'action_tab' => $academicPassed ? null : 'progress',
            ],
            [
                'key' => 'financial_clearance',
                'title' => 'Financial clearance',
                'passed' => $financialPassed,
                'status' => $financialPassed ? 'passed' : 'pending',
                'message' => $financialPassed ? 'Tuition and registration financial records are cleared.' : 'Financial clearance is not completed yet.',
                'icon' => 'fa-solid fa-wallet',
                'action_tab' => $financialPassed ? null : 'finance',
            ],
            [
                'key' => 'registration_status',
                'title' => 'Registration status',
                'passed' => $registrationPassed,
                'status' => $registrationPassed ? 'passed' : 'pending',
                'message' => $registrationPassed ? 'Student registration is active and eligible.' : 'Student registration or academic standing blocks graduation.',
                'icon' => 'fa-solid fa-id-card-clip',
                'action_tab' => $registrationPassed ? null : 'profile',
            ],
        ];

        $blockers = [];
        if (!$academicPassed) {
            $blockers[] = [
                'key' => 'academic_blockers',
                'title' => 'Academic blockers',
                'message' => 'Student has remaining, failed, carried, or in-progress courses.',
                'count' => $remaining->count(),
                'type' => 'warning',
                'action_tab' => 'progress',
            ];
        }

        if (!$financialPassed) {
            $blockers[] = [
                'key' => 'financial_blocker',
                'title' => 'Financial blocker',
                'message' => 'Tuition payment or registration financial clearance is not completed.',
                'count' => null,
                'type' => 'danger',
                'action_tab' => 'finance',
            ];
        }

        if (!$registrationPassed) {
            $blockers[] = [
                'key' => 'registration_blocker',
                'title' => 'Registration blocker',
                'message' => 'Student registration is inactive or the student is exhausted.',
                'count' => null,
                'type' => 'danger',
                'action_tab' => 'profile',
            ];
        }

        return response()->json([
            'eligible' => $eligible,
            'status' => $eligible ? 'eligible' : 'not_eligible',
            'title' => $eligible ? 'Eligible for graduation' : 'Not eligible yet',
            'message' => $eligible ? 'All graduation requirements are currently satisfied.' : 'Some graduation requirements still need attention.',
            'student' => [
                'id' => $student->id,
                'student_number' => $student->student_number,
                'full_name' => $student->user?->full_name,
                'program_name' => $student->program?->name,
                'specialization_name' => $student->specialization?->name,
            ],
            'academic_record' => $currentRecord,
            'progress' => [
                'total_courses' => $totalCourses,
                'completed_courses' => $completedCourses,
                'remaining_courses' => $remaining->count(),
                'carried_courses' => $carried->count(),
                'failed_courses' => $failed->count(),
                'in_progress_courses' => $inProgress->count(),
                'completion_percentage' => $completionPercentage,
                'completed_credits' => $completedCredits,
                'total_credits' => $totalCredits,
            ],
            'requirements' => $requirements,
            'blockers' => $blockers,
            'courses' => [
                'completed' => $completed,
                'remaining' => $remaining,
                'carried' => $carried,
                'failed' => $failed,
                'in_progress' => $inProgress,
            ],
        ]);
    }

    private function graduationCoursePriority(string $category): int
    {
        return match ($category) {
            'completed' => 4,
            'in_progress' => 3,
            'carried' => 2,
            'failed' => 1,
            default => 0,
        };
    }


    public function courseMaterials(Request $request): JsonResponse
    {
        $student = $this->authenticatedStudent($request);

        if (!$student) {
            return $this->studentOnlyResponse();
        }

        $student->loadMissing(['user', 'program', 'specialization']);

        $currentRecord = $student->academicRecords()
            ->with(['academicYear', 'studyYear'])
            ->orderByDesc('academic_year_id')
            ->orderByDesc('id')
            ->first();

        if (!$currentRecord) {
            return response()->json([
                'message' => 'No academic record found for this student.',
                'courses' => [],
            ], 404);
        }

        $enrollments = $student->courseEnrollments()
            ->with([
                'course.department',
                'academicYear',
                'studyYear',
                'grade',
                'course.doctorAssignments' => function ($query) use ($currentRecord) {
                    $query->with(['doctor.user'])
                        ->where('academic_year_id', $currentRecord->academic_year_id)
                        ->orderByDesc('is_primary')
                        ->orderBy('semester_number');
                },
                'course.materials' => function ($query) use ($currentRecord) {
                    $query->with(['doctor.user'])
                        ->where('is_published', true)
                        ->where(function ($scope) use ($currentRecord) {
                            $scope->whereNull('academic_year_id')
                                ->orWhere('academic_year_id', $currentRecord->academic_year_id);
                        })
                        ->orderBy('sort_order')
                        ->orderByDesc('published_at')
                        ->orderByDesc('created_at');
                },
            ])
            ->where('academic_year_id', $currentRecord->academic_year_id)
            ->orderBy('semester_number')
            ->orderBy('course_id')
            ->get();

        $courses = $enrollments->map(function (StudentCourseEnrollment $enrollment) {
            $course = $enrollment->course;
            $assignments = $course?->doctorAssignments ?? collect();
            $materials = $course?->materials ?? collect();

            return [
                'id' => $enrollment->id,
                'enrollment_id' => $enrollment->id,
                'course_id' => $enrollment->course_id,
                'course_code' => $course?->code,
                'course_name' => $course?->name,
                'department' => $course?->department?->name,
                'description' => $course?->description,
                'academic_year' => $enrollment->academicYear?->name,
                'study_year' => $enrollment->studyYear?->name,
                'semester_number' => $enrollment->semester_number,
                'credit_hours' => $course?->credit_hours,
                'status' => $enrollment->status,
                'grade_status' => $enrollment->grade?->result_status,
                'final_mark' => $enrollment->grade?->final_mark,
                'doctors' => $assignments->map(function ($assignment) {
                    return [
                        'id' => $assignment->doctor?->id,
                        'name' => $assignment->doctor?->user?->full_name,
                        'title' => $assignment->doctor?->academic_title,
                        'primary' => (bool) $assignment->is_primary,
                        'semester_number' => $assignment->semester_number,
                    ];
                })->filter(fn ($doctor) => !empty($doctor['id']) || !empty($doctor['name']))->values(),
                'materials_count' => $materials->count(),
                'materials' => $materials->map(function (CourseMaterial $material) {
                    $fileUrl = $material->file_path
                        ? asset('storage/' . ltrim(preg_replace('#^public/#', '', $material->file_path), '/'))
                        : null;

                    return [
                        'id' => $material->id,
                        'title' => $material->title,
                        'description' => $material->description,
                        'type' => $material->material_type,
                        'url' => $material->url ?: $fileUrl,
                        'file_url' => $fileUrl,
                        'file_path' => $material->file_path,
                        'original_name' => $material->original_name,
                        'mime_type' => $material->mime_type,
                        'size' => $material->size,
                        'doctor_name' => $material->doctor?->user?->full_name,
                        'published_at' => optional($material->published_at ?? $material->created_at)->toDateTimeString(),
                        'downloadable' => (bool) ($material->url || $material->file_path),
                    ];
                })->values(),
            ];
        })->values();

        return response()->json([
            'student' => [
                'id' => $student->id,
                'student_number' => $student->student_number,
                'full_name' => $student->user?->full_name,
                'program_name' => $student->program?->name,
                'specialization_name' => $student->specialization?->name,
            ],
            'academic_year' => $currentRecord->academicYear,
            'summary' => [
                'total_courses' => $courses->count(),
                'courses_with_materials' => $courses->filter(fn ($course) => ($course['materials_count'] ?? 0) > 0)->count(),
                'materials_count' => $courses->sum('materials_count'),
                'doctors_count' => $courses->flatMap(fn ($course) => collect($course['doctors'] ?? [])->pluck('id')->filter())->unique()->count(),
            ],
            'courses' => $courses,
        ]);
    }

    public function carriedCourses(Request $request): JsonResponse
    {
        $student = $this->authenticatedStudent($request);

        if (!$student) {
            return $this->studentOnlyResponse();
        }

        $student->loadMissing(['user', 'program', 'specialization']);

        $currentRecord = $student->academicRecords()
            ->orderByDesc('academic_year_id')
            ->orderByDesc('id')
            ->first();

        if (!$currentRecord) {
            return response()->json([
                'message' => 'No academic record found for this student.',
            ], 404);
        }

        $carriedEnrollments = $student->courseEnrollments()
            ->with(['course', 'grade', 'academicYear', 'studyYear'])
            ->where('academic_year_id', $currentRecord->academic_year_id)
            ->where('is_carried', true)
            ->get();

        return response()->json([
            'student' => [
                'id' => $student->id,
                'student_number' => $student->student_number,
                'full_name' => $student->user?->full_name,
            ],
            'academic_year_id' => $currentRecord->academic_year_id,
            'carried_courses_count' => $carriedEnrollments->count(),
            'carried_courses' => $carriedEnrollments->map(function ($enrollment) {
                return [
                    'enrollment_id' => $enrollment->id,
                    'course_id' => $enrollment->course_id,
                    'course_name' => $enrollment->course?->name,
                    'course_code' => $enrollment->course?->code,
                    'credit_hours' => $enrollment->course?->credit_hours,
                    'study_year' => $enrollment->studyYear?->name,
                    'semester_number' => $enrollment->semester_number,
                    'grade' => $this->formatGradePayload($enrollment->grade),
                ];
            })->values(),
        ]);
    }

    public function classSchedule(Request $request): JsonResponse
    {
        $student = $this->authenticatedStudent($request);

        if (!$student) {
            return $this->studentOnlyResponse();
        }

        $currentRecord = $student->academicRecords()
            ->orderByDesc('academic_year_id')
            ->orderByDesc('id')
            ->first();

        if (!$currentRecord) {
            return response()->json([
                'message' => 'No academic record found for this student.',
            ], 404);
        }

        $schedule = ClassSchedule::with([
            'program',
            'studyYear',
            'specialization',
            'items.course',
        ])
            ->where('program_id', $student->program_id)
            ->where('study_year_id', $currentRecord->study_year_id)
            ->where('is_active', true)
            ->where(function ($query) use ($student) {
                $query->whereNull('specialization_id');

                if ($student->specialization_id) {
                    $query->orWhere('specialization_id', $student->specialization_id);
                }
            })
            ->orderByRaw('CASE WHEN specialization_id IS NULL THEN 1 ELSE 0 END')
            ->latest()
            ->first();

        if (!$schedule) {
            return response()->json([
                'message' => 'No active class schedule found for this student.',
                'schedule' => null,
            ], 404);
        }

        return response()->json([
            'schedule' => $schedule,
        ]);
    }


    private function ensureStudentDocument(
        Student $student,
        string $documentType,
        string $documentTitle,
        $currentRecord = null,
        ?int $issuedByUserId = null,
        array $metadata = []
    ): StudentDocument {
        $existing = StudentDocument::query()
            ->where('student_id', $student->id)
            ->where('document_type', $documentType)
            ->when($currentRecord, function ($query) use ($currentRecord) {
                $query->where('academic_year_id', $currentRecord->academic_year_id);
            })
            ->where('status', 'valid')
            ->latest()
            ->first();

        if ($existing) {
            $existing->update([
                'document_title' => $documentTitle,
                'metadata' => array_merge($existing->metadata ?? [], $metadata),
            ]);

            return $existing->fresh(['student.user', 'student.program', 'student.specialization', 'academicYear']);
        }

        return StudentDocument::create([
            'student_id' => $student->id,
            'issued_by_user_id' => $issuedByUserId,
            'academic_year_id' => $currentRecord?->academic_year_id,
            'document_type' => $documentType,
            'document_title' => $documentTitle,
            'verification_code' => $this->generateDocumentVerificationCode(),
            'status' => 'valid',
            'issued_at' => now(),
            'expires_at' => now()->addYears(5),
            'metadata' => $metadata,
        ])->load(['student.user', 'student.program', 'student.specialization', 'academicYear']);
    }

    private function generateDocumentVerificationCode(): string
    {
        do {
            $code = 'DOC-' . strtoupper(Str::random(4)) . '-' . strtoupper(Str::random(4)) . '-' . strtoupper(Str::random(4));
        } while (StudentDocument::where('verification_code', $code)->exists());

        return $code;
    }

    private function verificationFrontendPath(?StudentDocument $document): ?string
    {
        if (!$document) {
            return null;
        }

        return '/verify-document/' . $document->verification_code;
    }

    private function formatOfficialDocument(array $document): array
    {
        return [
            'id' => $document['id'] ?? null,
            'title' => $document['title'] ?? 'Official Document',
            'description' => $document['description'] ?? null,
            'category' => $document['category'] ?? 'Academic',
            'mode' => $document['mode'] ?? 'request',
            'status' => $document['status'] ?? 'available',
            'available' => $document['available'] ?? true,
            'icon' => $document['icon'] ?? 'fa-solid fa-file-lines',
            'request_type' => $document['request_type'] ?? null,
            'instant_action' => $document['instant_action'] ?? null,
            'default_subject' => $document['default_subject'] ?? ($document['title'] ?? 'Official document request'),
            'default_description' => $document['default_description'] ?? ($document['description'] ?? 'Please process this official document request.'),
            'fee_required' => $document['fee_required'] ?? false,
            'reasons' => $document['reasons'] ?? [],
            'verification_code' => $document['verification_code'] ?? optional($document['student_document'] ?? null)->verification_code,
            'verification_url' => $document['verification_url'] ?? $this->verificationFrontendPath($document['student_document'] ?? null),
            'issued_at' => $document['issued_at'] ?? optional($document['student_document'] ?? null)->issued_at?->toDateTimeString(),
            'expires_at' => $document['expires_at'] ?? optional($document['student_document'] ?? null)->expires_at?->toDateTimeString(),
            'active_request_id' => $document['active_request_id'] ?? null,
            'last_updated' => now()->toDateTimeString(),
        ];
    }

    private function formatCalendarItem(array $item): array
    {
        $date = $item['date'] ?? null;
        $endDate = $item['end_date'] ?? null;

        return [
            'id' => $item['id'] ?? null,
            'type' => $item['type'] ?? 'general',
            'title' => $item['title'] ?? 'Academic calendar item',
            'description' => $item['description'] ?? null,
            'date' => $date ? Carbon::parse($date)->toDateString() : null,
            'end_date' => $endDate ? Carbon::parse($endDate)->toDateString() : null,
            'status' => $item['status'] ?? $this->calendarStatus($date, $endDate),
            'badge' => $item['badge'] ?? 'Calendar',
            'icon' => $item['icon'] ?? 'fa-solid fa-calendar-check',
            'action_tab' => $item['action_tab'] ?? null,
            'meta' => $item['meta'] ?? [],
        ];
    }

    private function calendarStatus($date, $endDate = null): string
    {
        if (!$date) {
            return 'pending';
        }

        $today = now()->startOfDay();
        $start = Carbon::parse($date)->startOfDay();
        $end = $endDate ? Carbon::parse($endDate)->endOfDay() : null;

        if ($end && $today->betweenIncluded($start, $end)) {
            return 'current';
        }

        if ($start->isPast() && !$start->isSameDay($today)) {
            return 'completed';
        }

        if ($today->diffInDays($start, false) <= 7) {
            return 'due_soon';
        }

        return 'upcoming';
    }

    private function formatEnrollmentGradeRow(StudentCourseEnrollment $enrollment): array
    {
        return [
            'enrollment_id' => $enrollment->id,
            'course_id' => $enrollment->course_id,
            'course_name' => $enrollment->course?->name,
            'course_code' => $enrollment->course?->code,
            'academic_year_id' => $enrollment->academic_year_id,
            'academic_year' => $enrollment->academicYear?->name,
            'study_year_id' => $enrollment->study_year_id,
            'study_year' => $enrollment->studyYear?->name,
            'semester_number' => $enrollment->semester_number,
            'is_carried' => $enrollment->is_carried,
            'is_supplementary' => $enrollment->is_supplementary,
            'enrollment_status' => $enrollment->status,
            'grade' => $this->formatGradePayload($enrollment->grade),
        ];
    }

    private function formatGradePayload(?StudentCourseGrade $grade): array
    {
        return [
            'id' => $grade?->id,
            'coursework_mark' => $grade?->coursework_mark ?? 0,
            'practical_mark' => $grade?->practical_mark ?? 0,
            'exam_mark' => $grade?->exam_mark ?? 0,
            'final_mark' => $grade?->final_mark ?? 0,
            'result_status' => $grade?->result_status ?? 'pending',
            'is_locked' => $grade?->is_locked ?? false,
            'last_updated_at' => $grade?->last_updated_at,
        ];
    }
}
