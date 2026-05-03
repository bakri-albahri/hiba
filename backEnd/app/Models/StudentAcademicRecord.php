<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentAcademicRecord extends Model
{
    use HasFactory;

    protected $fillable = [
        'student_id',
        'academic_year_id',
        'study_year_id',
        'registration_status',
        'academic_result',
        'annual_average',
        'carried_courses_count',
        'carried_courses_credit_sum',
        'tuition_paid',
        'payment_receipt_number',
        'payment_receipt_date',
        'auto_promoted',
        'consecutive_failures_in_same_year',
        'notes',
    ];

    protected $casts = [
        'annual_average' => 'decimal:2',
        'tuition_paid' => 'boolean',
        'payment_receipt_date' => 'date',
        'auto_promoted' => 'boolean',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function academicYear()
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function studyYear()
    {
        return $this->belongsTo(StudyYear::class);
    }

    public function tuitionFee()
    {
        return $this->hasOne(TuitionFee::class, 'study_year_id', 'study_year_id')
            ->whereColumn('academic_year_id', 'student_academic_records.academic_year_id')
            ->whereColumn('program_id', 'students.program_id');
    }
}