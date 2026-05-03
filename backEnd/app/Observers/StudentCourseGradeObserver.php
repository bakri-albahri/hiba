<?php

namespace App\Observers;

use App\Models\StudentCourseGrade;

class StudentCourseGradeObserver
{
    public function creating(StudentCourseGrade $grade): void
    {
        $grade->recalculateFinalMark();
    }

    public function updating(StudentCourseGrade $grade): void
    {
        $grade->recalculateFinalMark();
    }
}