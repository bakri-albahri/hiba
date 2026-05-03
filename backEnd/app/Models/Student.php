<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Student extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'student_number',
        'program_id',
        'specialization_id',
        'is_active_registration',
        'is_exhausted',
        'enrollment_date',
        'notes',
    ];

    protected $casts = [
        'is_active_registration' => 'boolean',
        'is_exhausted' => 'boolean',
        'enrollment_date' => 'date',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function program()
    {
        return $this->belongsTo(Program::class);
    }

    public function specialization()
    {
        return $this->belongsTo(Specialization::class);
    }

    public function academicRecords()
    {
        return $this->hasMany(StudentAcademicRecord::class);
    }

    public function statusHistories()
    {
        return $this->hasMany(StudentStatusHistory::class);
    }

    public function currentAcademicRecord()
    {
        return $this->hasOne(StudentAcademicRecord::class)->latestOfMany();
    }

    public function courseEnrollments()
    {
        return $this->hasMany(StudentCourseEnrollment::class);
    }

    public function notifications()
    {
        return $this->hasMany(Notification::class);
    }

    public function supplementaryExamRequests()
    {
        return $this->hasMany(SupplementaryExamRequest::class);
    }

}