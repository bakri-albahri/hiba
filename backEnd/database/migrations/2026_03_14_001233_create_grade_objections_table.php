<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('grade_objections', function (Blueprint $table) {
            $table->id();

            $table->foreignId('student_course_enrollment_id')
                ->constrained('student_course_enrollments')
                ->cascadeOnDelete();

            $table->foreignId('student_id')
                ->constrained('students')
                ->cascadeOnDelete();

            $table->text('objection_text');

            $table->enum('objection_target', ['coursework', 'practical', 'exam']);

            $table->enum('status', [
                'submitted',
                'under_review',
                'sent_to_doctor',
                'doctor_responded',
                'rejected_by_exams',
                'approved',
                'rejected',
            ])->default('submitted');

            $table->text('exam_department_note')->nullable();
            $table->text('doctor_response')->nullable();

            $table->decimal('doctor_suggested_coursework_mark', 5, 2)->nullable();
            $table->decimal('doctor_suggested_practical_mark', 5, 2)->nullable();
            $table->decimal('doctor_suggested_exam_mark', 5, 2)->nullable();

            $table->text('final_exam_decision_note')->nullable();

            $table->timestamp('submitted_at')->useCurrent();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('grade_objections');
    }
};