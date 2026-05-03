<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupplementaryExamSchedule extends Model
{
    protected $fillable = [
        'course_id',
        'academic_year_id',
        'exam_date',
        'exam_room',
    ];

    protected $casts = [
        'exam_date' => 'date',
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