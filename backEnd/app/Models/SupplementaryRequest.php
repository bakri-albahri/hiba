<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupplementaryRequest extends Model
{
    protected $fillable = [
        'student_id',
        'student_course_enrollment_id',
        'status'
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function enrollment()
    {
        return $this->belongsTo(StudentCourseEnrollment::class,'student_course_enrollment_id');
    }
}