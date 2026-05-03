<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_records', function (Blueprint $table) {
            $table->id();

            $table->foreignId('student_course_enrollment_id')
                ->constrained('student_course_enrollments')
                ->cascadeOnDelete();

            $table->foreignId('doctor_id')
                ->nullable()
                ->constrained('doctors')
                ->nullOnDelete();

            $table->date('attendance_date');
            $table->timestamp('recorded_at')->useCurrent();

            $table->timestamps();

            $table->unique([
                'student_course_enrollment_id',
                'attendance_date',
            ], 'student_course_attendance_unique_per_day');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_records');
    }
};