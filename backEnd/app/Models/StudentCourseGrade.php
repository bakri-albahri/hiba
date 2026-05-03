<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentCourseGrade extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_course_enrollment_id',
        'coursework_mark',
        'practical_mark',
        'exam_mark',
        'final_mark',
        'result_status',
        'is_locked',
        'last_updated_at',
    ];

    protected $casts = [
        'coursework_mark' => 'decimal:2',
        'practical_mark' => 'decimal:2',
        'exam_mark' => 'decimal:2',
        'final_mark' => 'decimal:2',
        'is_locked' => 'boolean',
        'last_updated_at' => 'datetime',
    ];

    public function enrollment()
    {
        return $this->belongsTo(StudentCourseEnrollment::class, 'student_course_enrollment_id');
    }

    public function recalculateFinalMark(): void
    {
        $coursework = $this->coursework_mark ?? 0;
        $practical = $this->practical_mark ?? 0;
        $exam = $this->exam_mark ?? 0;

        $this->final_mark = $coursework + $practical + $exam;
        $this->last_updated_at = now();
    }
}