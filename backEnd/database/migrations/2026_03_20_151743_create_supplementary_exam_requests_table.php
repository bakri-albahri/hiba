<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('supplementary_exam_requests', function (Blueprint $table) {
            $table->id();

            $table->foreignId('student_id')
                ->constrained('students')
                ->cascadeOnDelete();

            $table->foreignId('student_course_enrollment_id')
                ->constrained('student_course_enrollments')
                ->cascadeOnDelete();

            $table->foreignId('academic_year_id')
                ->constrained('academic_years')
                ->cascadeOnDelete();

            $table->string('status')->default('submitted');
            // submitted / approved / rejected

            $table->text('student_note')->nullable();
            $table->text('exam_department_note')->nullable();

            $table->foreignId('reviewed_by_user_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('reviewed_at')->nullable();

            $table->timestamps();

            $table->unique(
                ['student_course_enrollment_id', 'academic_year_id'],
                'supp_req_unique_enrollment_academic_year'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('supplementary_exam_requests');
    }
};