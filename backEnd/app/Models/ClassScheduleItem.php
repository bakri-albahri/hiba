<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ClassScheduleItem extends Model
{
    protected $fillable = [
        'class_schedule_id',
        'course_id',
        'day_of_week',
        'start_time',
        'end_time',
        'hall',
        'notes',
    ];

    public function classSchedule()
    {
        return $this->belongsTo(ClassSchedule::class);
    }

    public function course()
    {
        return $this->belongsTo(Course::class);
    }
}