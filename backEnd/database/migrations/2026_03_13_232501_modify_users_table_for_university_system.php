<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('name');

            $table->string('full_name');
            $table->string('father_name')->nullable();
            $table->string('mother_name')->nullable();
            $table->date('birth_date')->nullable();
            $table->string('birth_place')->nullable();
            $table->string('central_registry')->nullable();
            $table->string('national_id')->nullable()->unique();
            $table->string('nationality')->nullable();
            $table->enum('gender', ['male', 'female'])->nullable();
            $table->string('mobile')->nullable();
            $table->text('address')->nullable();
            $table->enum('type', ['super_admin', 'department_manager', 'employee', 'doctor', 'student', 'none'])->default('none')->after('password');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'full_name',
                'father_name',
                'mother_name',
                'birth_date',
                'birth_place',
                'central_registry',
                'national_id',
                'nationality',
                'gender',
                'mobile',
                'address',
                'type',
            ]);

            $table->string('name');
        });
    }
};