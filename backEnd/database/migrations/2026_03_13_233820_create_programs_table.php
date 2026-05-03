<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('programs', function (Blueprint $table) {

            $table->id();

            $table->string('name'); 
            // بكالوريوس إدارة أعمال – ماجستير – دكتوراه

            $table->enum('level', [
                'bachelor',
                'master',
                'phd'
            ]);

            $table->integer('total_years');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('programs');
    }
};
