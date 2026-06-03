<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_course_grades', function (Blueprint $table) {
            $table->id();

            $table->foreignId('student_course_enrollment_id')
                ->unique()
                ->constrained('student_course_enrollments')
                ->cascadeOnDelete();

            $table->decimal('coursework_mark', 5, 2)->nullable()->default(null); // raw mark out of 100; weighted as 20%
            $table->decimal('practical_mark', 5, 2)->nullable()->default(null);  // raw mark out of 100; weighted as 20%
            $table->decimal('exam_mark', 5, 2)->nullable()->default(null);       // raw mark out of 100; weighted as 60%

            $table->decimal('final_mark', 5, 2)->nullable()->default(null);

            $table->enum('result_status', [
                'pending',
                'passed',
                'conditionally_passed',
                'failed',
                'carried',
            ])->default('pending');

            $table->boolean('is_locked')->default(false);

            $table->timestamp('last_updated_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_course_grades');
    }
};