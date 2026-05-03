<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GradeObjection extends Model
{
    protected $fillable = [
        'student_course_enrollment_id',
        'student_id',
        'objection_text',
        'objection_target',
        'status',
        'exam_department_note',
        'doctor_response',
        'doctor_suggested_coursework_mark',
        'doctor_suggested_practical_mark',
        'doctor_suggested_exam_mark',
        'final_exam_decision_note',
    ];

    protected $casts = [
        'doctor_suggested_coursework_mark' => 'decimal:2',
        'doctor_suggested_practical_mark' => 'decimal:2',
        'doctor_suggested_exam_mark' => 'decimal:2',
        'submitted_at' => 'datetime',
    ];

    public function enrollment()
    {
        return $this->belongsTo(StudentCourseEnrollment::class, 'student_course_enrollment_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class);
    }
}