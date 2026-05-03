<?php

namespace App\Services;

use App\Models\Student;

class StudentNumberService
{
    public function generate(): string
    {
        $lastStudent = Student::orderByDesc('id')->first();

        $nextNumber = 1;

        if ($lastStudent && !empty($lastStudent->student_number)) {
            if (preg_match('/(\d+)$/', $lastStudent->student_number, $matches)) {
                $nextNumber = ((int) $matches[1]) + 1;
            }
        }

        do {
            $studentNumber = 'STU-' . str_pad((string) $nextNumber, 6, '0', STR_PAD_LEFT);
            $exists = Student::where('student_number', $studentNumber)->exists();
            $nextNumber++;
        } while ($exists);

        return $studentNumber;
    }
}