<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentCourseEnrollment extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'course_id',
        'academic_year_id',
        'study_year_id',
        'semester_number',
        'is_carried',
        'is_supplementary',
        'status',
        'notes',
    ];

    protected $casts = [
        'is_carried' => 'boolean',
        'is_supplementary' => 'boolean',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function studyYear()
    {
        return $this->belongsTo(StudyYear::class);
    }

    public function grade()
    {
        return $this->hasOne(StudentCourseGrade::class);
    }

    public function attendanceRecords()
    {
        return $this->hasMany(AttendanceRecord::class);
    }

    public function attendanceCount(): int
    {
        return $this->attendanceRecords()->count();
    }

    public function supplementaryExamRequests()
    {
        return $this->hasMany(SupplementaryExamRequest::class, 'student_course_enrollment_id');
    }
}