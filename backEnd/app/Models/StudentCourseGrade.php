<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentCourseGrade extends Model
{
    use HasFactory;

    public const COURSEWORK_WEIGHT = 0.20;
    public const PRACTICAL_WEIGHT = 0.20;
    public const EXAM_WEIGHT = 0.60;

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

    public static function calculateFinalMark($courseworkMark, $practicalMark, $examMark): ?float
    {
        $hasAnyRecordedComponent = $courseworkMark !== null || $practicalMark !== null || $examMark !== null;

        if (!$hasAnyRecordedComponent) {
            return null;
        }

        $coursework = (float) ($courseworkMark ?? 0);
        $practical = (float) ($practicalMark ?? 0);
        $exam = (float) ($examMark ?? 0);

        return round(
            ($coursework * self::COURSEWORK_WEIGHT)
            + ($practical * self::PRACTICAL_WEIGHT)
            + ($exam * self::EXAM_WEIGHT),
            2
        );
    }

    public function recalculateFinalMark(): void
    {
        $marksWereChanged = $this->isDirty([
            'coursework_mark',
            'practical_mark',
            'exam_mark',
        ]);

        $this->final_mark = self::calculateFinalMark(
            $this->coursework_mark,
            $this->practical_mark,
            $this->exam_mark
        );

        if ($this->final_mark !== null && ($marksWereChanged || !$this->last_updated_at)) {
            $this->last_updated_at = now();
        }
    }
}
