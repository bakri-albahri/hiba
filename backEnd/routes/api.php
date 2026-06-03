<?php

use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserProvisionController;
use App\Http\Controllers\Api\UserManagementController;

use App\Http\Controllers\Api\ProgramController;
use App\Http\Controllers\Api\SpecializationController;
use App\Http\Controllers\Api\StudyYearController;
use App\Http\Controllers\Api\AcademicYearController;

use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\StudentPortalController;
use App\Http\Controllers\Api\StudentServiceRequestController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\StudyPlanController;
use App\Http\Controllers\Api\EnrollmentController;
use App\Http\Controllers\Api\GradeController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\CourseAttendanceRequirementController;
use App\Http\Controllers\Api\GradeObjectionController;
use App\Http\Controllers\Api\SupplementaryExamController;

use App\Http\Controllers\Api\ExamManagementController;
use App\Http\Controllers\Api\ExamScheduleController;
use App\Http\Controllers\Api\SupplementaryExamScheduleController;
use App\Http\Controllers\Api\ClassScheduleController;

use App\Http\Controllers\Api\DepartmentController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\DoctorController;
use App\Http\Controllers\Api\DoctorCourseAssignmentController;
use App\Http\Controllers\Api\DoctorPortalController;

use App\Http\Controllers\Api\FinanceController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\ActivityLogController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ReportController;

use App\Http\Controllers\Api\AccountController;

use App\Http\Controllers\Api\StudentFinanceStatusController;
use App\Http\Controllers\Api\StudentExamScheduleController;


/*
|--------------------------------------------------------------------------
| Public Routes
|--------------------------------------------------------------------------
*/

Route::post('/login', [AuthController::class, 'login']);
Route::get('/document-verification/{verificationCode}', [StudentPortalController::class, 'verifyDocument']);

/*
|--------------------------------------------------------------------------
| Protected Routes
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/account/change-my-password', [AccountController::class, 'changeMyPassword']);
    Route::get('/student/finance-status', [StudentFinanceStatusController::class, 'show']);
    Route::get('/student/payment-history', [StudentPortalController::class, 'paymentHistory']);
    Route::get('/student/academic-calendar', [StudentPortalController::class, 'academicCalendar']);
    Route::get('/student/graduation-eligibility', [StudentPortalController::class, 'graduationEligibility']);
    Route::get('/student/course-materials', [StudentPortalController::class, 'courseMaterials']);
    Route::get('/student/official-documents', [StudentPortalController::class, 'officialDocuments']);
    Route::get('/student/exam-schedule', [StudentExamScheduleController::class, 'index']);
    Route::get('/student/exam-card', [StudentExamScheduleController::class, 'examCard']);
    Route::get('/dashboard/financial-summary', [DashboardController::class, 'financialSummary'])
    ->middleware('permission:view dashboard');
    
    /*
    |--------------------------------------------------------------------------
    | Auth
    |--------------------------------------------------------------------------
    */

    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);

    /*
    |--------------------------------------------------------------------------
    | Doctor Portal Self-Service
    |--------------------------------------------------------------------------
    */

    Route::get('/doctor-portal/profile', [DoctorPortalController::class, 'profile']);
    Route::get('/doctor-portal/courses', [DoctorPortalController::class, 'courses']);
    Route::get('/doctor-portal/grade-objections', [DoctorPortalController::class, 'gradeObjections']);
    Route::get('/doctor-portal/attendance', [DoctorPortalController::class, 'attendance']);
    Route::post('/doctor-portal/attendance/record', [DoctorPortalController::class, 'recordAttendance']);

    /*
    |--------------------------------------------------------------------------
    | Student Portal Self-Service
    |--------------------------------------------------------------------------
    */

    Route::get('/student/profile', [StudentPortalController::class, 'profile']);
    Route::get('/student/current-academic-record', [StudentPortalController::class, 'currentAcademicRecord']);
    Route::get('/student/academic-summary', [StudentPortalController::class, 'academicSummary']);
    Route::get('/student/grades', [StudentPortalController::class, 'grades']);
    Route::get('/student/grade-objections', [StudentPortalController::class, 'gradeObjections']);
    Route::get('/student/attendance', [StudentPortalController::class, 'attendance']);
    Route::get('/student/carried-courses', [StudentPortalController::class, 'carriedCourses']);
    Route::get('/student/class-schedule', [StudentPortalController::class, 'classSchedule']);
    Route::get('/student/service-requests', [StudentServiceRequestController::class, 'myRequests']);
    Route::get('/student/service-requests/{requestId}', [StudentServiceRequestController::class, 'showMine']);
    Route::post('/student/service-requests', [StudentServiceRequestController::class, 'submit']);
    Route::patch('/student/service-requests/{requestId}/cancel', [StudentServiceRequestController::class, 'cancel']);



    /*
    |--------------------------------------------------------------------------
    | Student Service Requests
    |--------------------------------------------------------------------------
    */

    Route::get('/student-service-requests', [StudentServiceRequestController::class, 'index'])
        ->middleware('permission:view undergraduate students|view postgraduate students');

    Route::get('/student-service-requests/{requestId}', [StudentServiceRequestController::class, 'show'])
        ->middleware('permission:view undergraduate students|view postgraduate students');

    Route::patch('/student-service-requests/{requestId}/status', [StudentServiceRequestController::class, 'updateStatus'])
        ->middleware('permission:update undergraduate students|update postgraduate students');

    /*
    |--------------------------------------------------------------------------
    | User Provisioning
    |--------------------------------------------------------------------------
    */

    Route::post('/users/provision', [UserProvisionController::class, 'store'])
        ->middleware('permission:create undergraduate students|create postgraduate students|create employees|create doctors');

    /*
    |--------------------------------------------------------------------------
    | Users
    |--------------------------------------------------------------------------
    */

    Route::get('/users', [UserManagementController::class, 'index'])
        ->middleware('permission:view users');

    Route::get('/users/{userId}', [UserManagementController::class, 'show'])
        ->middleware('permission:view users');

    Route::post('/users', [UserManagementController::class, 'store'])
        ->middleware('permission:create users');

    Route::put('/users/{userId}', [UserManagementController::class, 'update'])
        ->middleware('permission:update users');

    Route::delete('/users/{userId}', [UserManagementController::class, 'destroy'])
        ->middleware('permission:delete users');

    /*
    |--------------------------------------------------------------------------
    | Academic Structure
    |--------------------------------------------------------------------------
    */

    Route::get('/programs', [ProgramController::class, 'index'])
        ->middleware('permission:manage academic structure|view undergraduate students|create undergraduate students|update undergraduate students|change undergraduate student status|manage undergraduate schedules|set course attendance limits|send student notifications|manage student grades|manage exam schedules|manage supplementary exam schedules|close academic year|set annual tuition fees|update tuition payment status|view postgraduate students|create postgraduate students|update postgraduate students|manage postgraduate schedules');
    Route::get('/programs/{programId}', [ProgramController::class, 'show'])
        ->middleware('permission:manage academic structure|view undergraduate students|create undergraduate students|update undergraduate students|change undergraduate student status|manage undergraduate schedules|set course attendance limits|send student notifications|manage student grades|manage exam schedules|manage supplementary exam schedules|close academic year|set annual tuition fees|update tuition payment status|view postgraduate students|create postgraduate students|update postgraduate students|manage postgraduate schedules');
    Route::post('/programs', [ProgramController::class, 'store'])
        ->middleware('permission:manage academic structure');
    Route::put('/programs/{programId}', [ProgramController::class, 'update'])
        ->middleware('permission:manage academic structure');
    Route::delete('/programs/{programId}', [ProgramController::class, 'destroy'])
        ->middleware('permission:manage academic structure');

    Route::get('/specializations', [SpecializationController::class, 'index'])
        ->middleware('permission:manage academic structure|view undergraduate students|create undergraduate students|update undergraduate students|change undergraduate student status|manage undergraduate schedules|set course attendance limits|send student notifications|manage student grades|manage exam schedules|manage supplementary exam schedules|close academic year|set annual tuition fees|update tuition payment status|view postgraduate students|create postgraduate students|update postgraduate students|manage postgraduate schedules');
    Route::get('/specializations/{specializationId}', [SpecializationController::class, 'show'])
        ->middleware('permission:manage academic structure|view undergraduate students|create undergraduate students|update undergraduate students|change undergraduate student status|manage undergraduate schedules|set course attendance limits|send student notifications|manage student grades|manage exam schedules|manage supplementary exam schedules|close academic year|set annual tuition fees|update tuition payment status|view postgraduate students|create postgraduate students|update postgraduate students|manage postgraduate schedules');
    Route::post('/specializations', [SpecializationController::class, 'store'])
        ->middleware('permission:manage academic structure');
    Route::put('/specializations/{specializationId}', [SpecializationController::class, 'update'])
        ->middleware('permission:manage academic structure');
    Route::delete('/specializations/{specializationId}', [SpecializationController::class, 'destroy'])
        ->middleware('permission:manage academic structure');

    Route::get('/study-years', [StudyYearController::class, 'index'])
        ->middleware('permission:manage academic structure|view undergraduate students|create undergraduate students|update undergraduate students|change undergraduate student status|manage undergraduate schedules|set course attendance limits|send student notifications|manage student grades|manage exam schedules|manage supplementary exam schedules|close academic year|set annual tuition fees|update tuition payment status|view postgraduate students|create postgraduate students|update postgraduate students|manage postgraduate schedules');
    Route::get('/study-years/{studyYearId}', [StudyYearController::class, 'show'])
        ->middleware('permission:manage academic structure|view undergraduate students|create undergraduate students|update undergraduate students|change undergraduate student status|manage undergraduate schedules|set course attendance limits|send student notifications|manage student grades|manage exam schedules|manage supplementary exam schedules|close academic year|set annual tuition fees|update tuition payment status|view postgraduate students|create postgraduate students|update postgraduate students|manage postgraduate schedules');
    Route::post('/study-years', [StudyYearController::class, 'store'])
        ->middleware('permission:manage academic structure');
    Route::put('/study-years/{studyYearId}', [StudyYearController::class, 'update'])
        ->middleware('permission:manage academic structure');
    Route::delete('/study-years/{studyYearId}', [StudyYearController::class, 'destroy'])
        ->middleware('permission:manage academic structure');

    Route::get('/academic-years', [AcademicYearController::class, 'index'])
        ->middleware('permission:manage academic structure|view undergraduate students|create undergraduate students|update undergraduate students|change undergraduate student status|manage undergraduate schedules|set course attendance limits|send student notifications|manage student grades|manage exam schedules|manage supplementary exam schedules|close academic year|set annual tuition fees|update tuition payment status|view postgraduate students|create postgraduate students|update postgraduate students|manage postgraduate schedules');
    Route::get('/academic-years/{academicYearId}', [AcademicYearController::class, 'show'])
        ->middleware('permission:manage academic structure|view undergraduate students|create undergraduate students|update undergraduate students|change undergraduate student status|manage undergraduate schedules|set course attendance limits|send student notifications|manage student grades|manage exam schedules|manage supplementary exam schedules|close academic year|set annual tuition fees|update tuition payment status|view postgraduate students|create postgraduate students|update postgraduate students|manage postgraduate schedules');
    Route::post('/academic-years', [AcademicYearController::class, 'store'])
        ->middleware('permission:manage academic structure');
    Route::put('/academic-years/{academicYearId}', [AcademicYearController::class, 'update'])
        ->middleware('permission:manage academic structure');
    Route::delete('/academic-years/{academicYearId}', [AcademicYearController::class, 'destroy'])
        ->middleware('permission:manage academic structure');

    /*
    |--------------------------------------------------------------------------
    | Students
    |--------------------------------------------------------------------------
    */

    Route::get('/students', [StudentController::class, 'index'])
        ->middleware('permission:view undergraduate students|view postgraduate students');

    Route::get('/students/{studentId}', [StudentController::class, 'show'])
        ->middleware('permission:view undergraduate students|view postgraduate students');

    Route::post('/students', [StudentController::class, 'store'])
        ->middleware('permission:create undergraduate students|create postgraduate students');

    Route::put('/students/{studentId}', [StudentController::class, 'update'])
        ->middleware('permission:update undergraduate students|update postgraduate students');

    Route::patch('/students/{studentId}/registration-status', [StudentController::class, 'changeRegistrationStatus'])
        ->middleware('permission:change undergraduate student status|update postgraduate students');

    
    Route::get('/students/{studentId}/current-academic-record', [StudentController::class, 'currentAcademicRecord'])
    ->middleware('permission:view undergraduate students|view postgraduate students');

    Route::get('/students/{studentId}/carried-courses', [StudentController::class, 'carriedCourses'])
        ->middleware('permission:view undergraduate students|view postgraduate students');

    Route::get('/students/{studentId}/academic-summary', [StudentController::class, 'academicSummary'])
        ->middleware('permission:view undergraduate students|view postgraduate students');

    
        /*
    |--------------------------------------------------------------------------
    | Courses
    |--------------------------------------------------------------------------
    */

    Route::get('/courses', [CourseController::class, 'index'])
        ->middleware('permission:manage departments|manage exam schedules|manage supplementary exam schedules|manage undergraduate schedules|set course attendance limits|view undergraduate students|create undergraduate students|update undergraduate students|view postgraduate students|create postgraduate students|update postgraduate students|manage postgraduate schedules');

    Route::get('/courses/{courseId}', [CourseController::class, 'show'])
        ->middleware('permission:manage departments|manage exam schedules|manage supplementary exam schedules|manage undergraduate schedules|set course attendance limits|view undergraduate students|create undergraduate students|update undergraduate students|view postgraduate students|create postgraduate students|update postgraduate students|manage postgraduate schedules');

    Route::post('/courses', [CourseController::class, 'store'])
        ->middleware('permission:manage departments');

    Route::put('/courses/{courseId}', [CourseController::class, 'update'])
        ->middleware('permission:manage departments');

  

    /*
    |--------------------------------------------------------------------------
    | Study Plans
    |--------------------------------------------------------------------------
    */

    Route::get('/study-plans', [StudyPlanController::class, 'index'])
        ->middleware('permission:manage departments');

    Route::get('/study-plans/{studyPlanId}', [StudyPlanController::class, 'show'])
        ->middleware('permission:manage departments');

    Route::post('/study-plans', [StudyPlanController::class, 'store'])
        ->middleware('permission:manage departments');

    Route::post('/study-plans/{studyPlanId}/courses', [StudyPlanController::class, 'attachCourses'])
        ->middleware('permission:manage departments');

    /*
    |--------------------------------------------------------------------------
    | Enrollments
    |--------------------------------------------------------------------------
    */

    Route::post('/students/{studentId}/auto-enroll', [EnrollmentController::class, 'autoEnrollStudent'])
        ->middleware('permission:create undergraduate students|create postgraduate students');

    /*
    |--------------------------------------------------------------------------
    | Grades
    |--------------------------------------------------------------------------
    */

    Route::get('/students/{studentId}/grades', [GradeController::class, 'indexByStudent'])
        ->middleware('permission:view undergraduate students|view postgraduate students');

    Route::get('/courses/{courseId}/academic-years/{academicYearId}/grades', [GradeController::class, 'indexByCourseAndAcademicYear'])
        ->middleware('permission:manage student grades');

    Route::get('/courses/{courseId}/academic-years/{academicYearId}/students-for-grading', [GradeController::class, 'studentsForCourseGrading'])
        ->middleware('permission:manage student grades');

    Route::post('/courses/{courseId}/academic-years/{academicYearId}/grades/bulk', [GradeController::class, 'bulkStoreOrUpdate'])
        ->middleware('permission:manage student grades');

    Route::post('/enrollments/{enrollmentId}/grades', [GradeController::class, 'storeOrUpdate'])
        ->middleware('permission:manage student grades');

    Route::patch('/enrollments/{enrollmentId}/grades/lock', [GradeController::class, 'lock'])
        ->middleware('permission:manage student grades');

    Route::get('/students/{studentId}/academic-years/{academicYearId}/grades', [GradeController::class, 'indexByStudentAndAcademicYear'])
    ->middleware('permission:view undergraduate students|view postgraduate students');

    Route::post('/grades/quick-entry', [GradeController::class, 'quickStoreByCourseAndStudentNumber'])
        ->middleware('permission:manage student grades');
    /*
    |--------------------------------------------------------------------------
    | Attendance
    |--------------------------------------------------------------------------
    */

    Route::post('/attendance/record', [AttendanceController::class, 'recordByStudentNumber'])
        ->middleware('permission:set course attendance limits|manage undergraduate schedules|manage postgraduate schedules');

    Route::get('/students/{studentId}/attendance', [AttendanceController::class, 'listByStudent'])
        ->middleware('permission:view undergraduate students|view postgraduate students');

    Route::get('/course-attendance-requirements', [CourseAttendanceRequirementController::class, 'index'])
        ->middleware('permission:set course attendance limits|manage undergraduate schedules|manage postgraduate schedules');

    Route::post('/course-attendance-requirements', [CourseAttendanceRequirementController::class, 'store'])
        ->middleware('permission:set course attendance limits|manage undergraduate schedules|manage postgraduate schedules');

    Route::get('/course-attendance-requirements/{requirementId}', [CourseAttendanceRequirementController::class, 'show'])
        ->middleware('permission:set course attendance limits|manage undergraduate schedules|manage postgraduate schedules');

    Route::put('/course-attendance-requirements/{requirementId}', [CourseAttendanceRequirementController::class, 'update'])
        ->middleware('permission:set course attendance limits|manage undergraduate schedules|manage postgraduate schedules');

    Route::delete('/course-attendance-requirements/{requirementId}', [CourseAttendanceRequirementController::class, 'destroy'])
        ->middleware('permission:set course attendance limits|manage undergraduate schedules|manage postgraduate schedules');

       /*
    |--------------------------------------------------------------------------
    | Grade Objections
    |--------------------------------------------------------------------------
    */

    Route::get('/grade-objections', [GradeObjectionController::class, 'index'])
        ->middleware('permission:manage grade objections');

    Route::get('/grade-objections/{objectionId}', [GradeObjectionController::class, 'show'])
        ->middleware('permission:manage grade objections');

    Route::post('/grade-objections', [GradeObjectionController::class, 'store']);

    Route::patch('/grade-objections/{objectionId}/under-review', [GradeObjectionController::class, 'markUnderReview'])
        ->middleware('permission:manage grade objections');

    Route::patch('/grade-objections/{objectionId}/initial-review', [GradeObjectionController::class, 'initialReview'])
        ->middleware('permission:manage grade objections');

    Route::patch('/grade-objections/{objectionId}/doctor-response', [GradeObjectionController::class, 'doctorRespond']);

    Route::patch('/grade-objections/{objectionId}/final-decision', [GradeObjectionController::class, 'finalDecision'])
        ->middleware('permission:manage grade objections');
        
    /*
    |--------------------------------------------------------------------------
    | Supplementary Exams
    |--------------------------------------------------------------------------
    */

    Route::get('/students/{studentId}/supplementary/eligible', [SupplementaryExamController::class, 'eligibleCourses']);

    Route::post('/supplementary-requests', [SupplementaryExamController::class, 'submitRequest']);

    Route::get('/supplementary-requests', [SupplementaryExamController::class, 'index'])
        ->middleware('permission:review supplementary requests');

    Route::get('/supplementary-requests/{requestId}', [SupplementaryExamController::class, 'show'])
        ->middleware('permission:review supplementary requests');

    Route::patch('/supplementary-requests/{requestId}/approve', [SupplementaryExamController::class, 'approve'])
        ->middleware('permission:review supplementary requests');

    Route::patch('/supplementary-requests/{requestId}/reject', [SupplementaryExamController::class, 'reject'])
        ->middleware('permission:review supplementary requests');

    /*
    |--------------------------------------------------------------------------
    | Academic Year Closing
    |--------------------------------------------------------------------------
    */

    Route::post('/exams/academic-years/{academicYearId}/confirm-end', [ExamManagementController::class, 'confirmAcademicYearEnd'])
        ->middleware('permission:close academic year');

    /*
    |--------------------------------------------------------------------------
    | Exam Schedules
    |--------------------------------------------------------------------------
    */

    Route::get('/exam-schedules', [ExamScheduleController::class, 'index'])
        ->middleware('permission:manage exam schedules');

    Route::post('/exam-schedules', [ExamScheduleController::class, 'store'])
        ->middleware('permission:manage exam schedules');

    Route::get('/exam-schedules/{scheduleId}', [ExamScheduleController::class, 'show'])
        ->middleware('permission:manage exam schedules');

    Route::put('/exam-schedules/{scheduleId}', [ExamScheduleController::class, 'update'])
        ->middleware('permission:manage exam schedules');

    Route::delete('/exam-schedules/{scheduleId}', [ExamScheduleController::class, 'destroy'])
        ->middleware('permission:manage exam schedules');

    /*
    |--------------------------------------------------------------------------
    | Supplementary Exam Schedules
    |--------------------------------------------------------------------------
    */

    Route::get('/supplementary-exam-schedules', [SupplementaryExamScheduleController::class, 'index'])
        ->middleware('permission:manage supplementary exam schedules');

    Route::post('/supplementary-exam-schedules', [SupplementaryExamScheduleController::class, 'store'])
        ->middleware('permission:manage supplementary exam schedules');

    Route::get('/supplementary-exam-schedules/{scheduleId}', [SupplementaryExamScheduleController::class, 'show'])
        ->middleware('permission:manage supplementary exam schedules');

    Route::put('/supplementary-exam-schedules/{scheduleId}', [SupplementaryExamScheduleController::class, 'update'])
        ->middleware('permission:manage supplementary exam schedules');

    Route::delete('/supplementary-exam-schedules/{scheduleId}', [SupplementaryExamScheduleController::class, 'destroy'])
        ->middleware('permission:manage supplementary exam schedules');

    /*
    |--------------------------------------------------------------------------
    | Class Schedules
    |--------------------------------------------------------------------------
    */

    Route::get('/class-schedules', [ClassScheduleController::class, 'index'])
        ->middleware('permission:manage undergraduate schedules|manage postgraduate schedules');

    Route::post('/class-schedules', [ClassScheduleController::class, 'store'])
        ->middleware('permission:manage undergraduate schedules|manage postgraduate schedules');

    Route::get('/class-schedules/{scheduleId}', [ClassScheduleController::class, 'show'])
        ->middleware('permission:manage undergraduate schedules|manage postgraduate schedules');

    Route::put('/class-schedules/{scheduleId}', [ClassScheduleController::class, 'update'])
        ->middleware('permission:manage undergraduate schedules|manage postgraduate schedules');

    Route::post('/class-schedules/{scheduleId}/items', [ClassScheduleController::class, 'addItem'])
        ->middleware('permission:manage undergraduate schedules|manage postgraduate schedules');

    Route::put('/class-schedule-items/{itemId}', [ClassScheduleController::class, 'updateItem'])
        ->middleware('permission:manage undergraduate schedules|manage postgraduate schedules');

    Route::delete('/class-schedule-items/{itemId}', [ClassScheduleController::class, 'destroyItem'])
        ->middleware('permission:manage undergraduate schedules|manage postgraduate schedules');

    /*
    |--------------------------------------------------------------------------
    | Departments
    |--------------------------------------------------------------------------
    */

    Route::get('/departments', [DepartmentController::class, 'index'])
        ->middleware('permission:manage departments');

    Route::post('/departments', [DepartmentController::class, 'store'])
        ->middleware('permission:manage departments');

    Route::get('/departments/{departmentId}', [DepartmentController::class, 'show'])
        ->middleware('permission:manage departments');

    Route::put('/departments/{departmentId}', [DepartmentController::class, 'update'])
        ->middleware('permission:manage departments');

    Route::delete('/departments/{departmentId}', [DepartmentController::class, 'destroy'])
        ->middleware('permission:manage departments');

    /*
    |--------------------------------------------------------------------------
    | Employees
    |--------------------------------------------------------------------------
    */

    Route::get('/employees', [EmployeeController::class, 'index'])
        ->middleware('permission:create employees|update employees|assign employee permissions|assign department managers');

    Route::post('/employees', [EmployeeController::class, 'store'])
        ->middleware('permission:create employees');

    Route::get('/employees/{employeeId}', [EmployeeController::class, 'show'])
        ->middleware('permission:create employees|update employees|assign employee permissions|assign department managers');

    Route::put('/employees/{employeeId}', [EmployeeController::class, 'update'])
        ->middleware('permission:update employees');

    Route::delete('/employees/{employeeId}', [EmployeeController::class, 'destroy'])
        ->middleware('permission:update employees');

    Route::patch('/employees/{employeeId}/assign-manager', [EmployeeController::class, 'assignAsDepartmentManager'])
        ->middleware('permission:assign department managers');

    /*
    |--------------------------------------------------------------------------
    | Doctors
    |--------------------------------------------------------------------------
    */

    Route::get('/doctors', [DoctorController::class, 'index'])
        ->middleware('permission:create doctors|update doctors|delete doctors');

    Route::post('/doctors', [DoctorController::class, 'store'])
        ->middleware('permission:create doctors');

    Route::get('/doctors/{doctorId}', [DoctorController::class, 'show'])
        ->middleware('permission:create doctors|update doctors|delete doctors');

    Route::put('/doctors/{doctorId}', [DoctorController::class, 'update'])
        ->middleware('permission:update doctors');

    Route::delete('/doctors/{doctorId}', [DoctorController::class, 'destroy'])
        ->middleware('permission:delete doctors');

    /*
    |--------------------------------------------------------------------------
    | Doctor Course Assignments
    |--------------------------------------------------------------------------
    */

    Route::get('/doctor-course-assignments', [DoctorCourseAssignmentController::class, 'index'])
        ->middleware('permission:manage doctor course assignments');

    Route::post('/doctor-course-assignments', [DoctorCourseAssignmentController::class, 'store'])
        ->middleware('permission:manage doctor course assignments');

    Route::get('/doctor-course-assignments/{assignmentId}', [DoctorCourseAssignmentController::class, 'show'])
        ->middleware('permission:manage doctor course assignments');

    Route::put('/doctor-course-assignments/{assignmentId}', [DoctorCourseAssignmentController::class, 'update'])
        ->middleware('permission:manage doctor course assignments');

    Route::delete('/doctor-course-assignments/{assignmentId}', [DoctorCourseAssignmentController::class, 'destroy'])
        ->middleware('permission:manage doctor course assignments');

    Route::get('/doctors/{doctorId}/courses', [DoctorCourseAssignmentController::class, 'listDoctorCourses'])
        ->middleware('permission:manage doctor course assignments');

    /*
    |--------------------------------------------------------------------------
    | Dashboard
    |--------------------------------------------------------------------------
    */

    Route::get('/dashboard/overview', [DashboardController::class, 'overview'])
        ->middleware('permission:view dashboard');

    Route::get('/dashboard/academic-summary', [DashboardController::class, 'academicSummary'])
        ->middleware('permission:view dashboard');

    Route::get('/dashboard/user-summary', [DashboardController::class, 'userSummary'])
        ->middleware('permission:view dashboard');

    /*
    |--------------------------------------------------------------------------
    | Reports
    |--------------------------------------------------------------------------
    */

    Route::get('/reports/students/{studentId}', [ReportController::class, 'studentReport'])
        ->middleware('permission:view reports');

    Route::get('/reports/departments/{departmentId}', [ReportController::class, 'departmentReport'])
        ->middleware('permission:view reports');

    /*
    |--------------------------------------------------------------------------
    | Finance
    |--------------------------------------------------------------------------
    */

    Route::get('/finance/tuition-fees', [FinanceController::class, 'listTuitionFees'])
        ->middleware('permission:set annual tuition fees');

    Route::post('/finance/tuition-fees', [FinanceController::class, 'createOrUpdateTuitionFee'])
        ->middleware('permission:set annual tuition fees');

    Route::get('/finance/students-status', [FinanceController::class, 'listStudentsFinancialStatus'])
        ->middleware('permission:update tuition payment status');

    Route::get('/finance/students/{studentId}', [FinanceController::class, 'showStudentFinance'])
        ->middleware('permission:update tuition payment status');

    Route::patch('/finance/student-academic-records/{studentAcademicRecordId}/tuition-status', [FinanceController::class, 'updateStudentTuitionStatus'])
        ->middleware('permission:update tuition payment status');

    /*
    |--------------------------------------------------------------------------
    | Notifications
    |--------------------------------------------------------------------------
    */

    Route::get('/notifications/me', [NotificationController::class, 'indexMyNotifications']);
    Route::patch('/notifications/{notificationId}/read', [NotificationController::class, 'markAsRead']);
    Route::patch('/notifications/read-all', [NotificationController::class, 'markAllAsRead']);

    Route::get('/notifications', [NotificationController::class, 'indexAll'])
        ->middleware('permission:send student notifications');

    Route::get('/notifications/{notificationId}', [NotificationController::class, 'show'])
        ->middleware('permission:send student notifications');

    Route::post('/notifications/students/send', [NotificationController::class, 'sendToStudent'])
        ->middleware('permission:send student notifications');

    Route::post('/notifications/students/send-all', [NotificationController::class, 'sendToAllStudents'])
        ->middleware('permission:send student notifications');

    /*
    |--------------------------------------------------------------------------
    | Activity Logs
    |--------------------------------------------------------------------------
    */

    Route::get('/activity-logs', [ActivityLogController::class, 'index'])
        ->middleware('permission:view activity logs');

    Route::get('/activity-logs/me', [ActivityLogController::class, 'myLogs']);

    Route::get('/activity-logs/{logId}', [ActivityLogController::class, 'show'])
        ->middleware('permission:view activity logs');
});