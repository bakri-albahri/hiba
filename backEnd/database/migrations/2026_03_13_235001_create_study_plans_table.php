<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('study_plans', function (Blueprint $table) {
            $table->id();

            $table->foreignId('program_id')
                ->constrained('programs')
                ->cascadeOnDelete();

            $table->foreignId('specialization_id')
                ->nullable()
                ->constrained('specializations')
                ->nullOnDelete();

            $table->foreignId('study_year_id')
                ->constrained('study_years')
                ->cascadeOnDelete();

            $table->unsignedTinyInteger('semester_number'); // 1 or 2

            $table->string('name');
            $table->boolean('is_active')->default(true);
            $table->text('notes')->nullable();

            $table->timestamps();

            $table->unique([
                'program_id',
                'specialization_id',
                'study_year_id',
                'semester_number'
            ], 'study_plans_unique_structure');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('study_plans');
    }
};