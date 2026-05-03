<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tuition_fees', function (Blueprint $table) {
            $table->id();

            $table->foreignId('program_id')
                ->constrained('programs')
                ->cascadeOnDelete();

            $table->foreignId('academic_year_id')
                ->constrained('academic_years')
                ->cascadeOnDelete();

            $table->foreignId('study_year_id')
                ->constrained('study_years')
                ->cascadeOnDelete();

            $table->decimal('amount', 12, 2);

            $table->boolean('is_active')->default(true);

            $table->text('notes')->nullable();

            $table->timestamps();

            $table->unique(
                ['program_id', 'academic_year_id', 'study_year_id'],
                'tuition_program_year_study_unique'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tuition_fees');
    }
};
