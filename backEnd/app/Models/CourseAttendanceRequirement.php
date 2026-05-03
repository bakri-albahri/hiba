<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CourseAttendanceRequirement extends Model
{
    protected $fillable = [
        'course_id',
        'academic_year_id',
        'semester_number',
        'required_attendance_count'
    ];

    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }
}
