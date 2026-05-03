<?php

namespace App\Services;

use App\Models\Notification;
use App\Models\Student;
use App\Models\User;
use Illuminate\Support\Collection;

class NotificationService
{
    public function sendToUser(
        int $userId,
        ?int $studentId,
        string $type,
        string $title,
        string $message,
        ?array $meta = null
    ): Notification {
        return Notification::create([
            'user_id' => $userId,
            'student_id' => $studentId,
            'type' => $type,
            'title' => $title,
            'message' => $message,
            'meta' => $meta,
            'is_read' => false,
            'read_at' => null,
        ]);
    }

    public function sendToStudent(
        Student $student,
        string $type,
        string $title,
        string $message,
        ?array $meta = null
    ): Notification {
        return $this->sendToUser(
            $student->user_id,
            $student->id,
            $type,
            $title,
            $message,
            $meta
        );
    }

    public function sendToAllStudents(
        string $type,
        string $title,
        string $message,
        ?array $meta = null
    ): int {
        $students = Student::all();
        $count = 0;

        foreach ($students as $student) {
            $this->sendToStudent(
                $student,
                $type,
                $title,
                $message,
                $meta
            );

            $count++;
        }

        return $count;
    }

    public function sendToAllSuperAdmins(
        string $type,
        string $title,
        string $message,
        ?array $meta = null
    ): int {
        $count = 0;

        $superAdmins = User::role('super_admin')->get();

        foreach ($superAdmins as $superAdmin) {
            $this->sendToUser(
                $superAdmin->id,
                null,
                $type,
                $title,
                $message,
                $meta
            );

            $count++;
        }

        return $count;
    }
}