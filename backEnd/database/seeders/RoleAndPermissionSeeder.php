<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;

class RoleAndPermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            // Users
            'view users',
            'create users',
            'update users',
            'delete users',

            // Academic structure
            'manage academic structure',

            // Departments management
            'manage departments',
            'assign department permissions',

            // Student affairs
            'view undergraduate students',
            'create undergraduate students',
            'update undergraduate students',
            'change undergraduate student status',
            'create undergraduate schedules',
            'manage undergraduate schedules',
            'set course attendance limits',
            'send student notifications',

            // Finance
            'set annual tuition fees',
            'update tuition payment status',

            // Exams
            'close academic year',
            'manage student grades',
            'manage grade objections',
            'manage exam schedules',
            'manage supplementary exam schedules',
            'review supplementary requests',

            // Postgraduate
            'view postgraduate students',
            'create postgraduate students',
            'update postgraduate students',
            'create postgraduate schedules',
            'manage postgraduate schedules',

            // General employee management
            'create employees',
            'update employees',
            'assign employee permissions',
            'assign department managers',

            // Doctors
            'create doctors',
            'update doctors',
            'delete doctors',
            'manage doctor course assignments',

            // System
            'view dashboard',
            'view reports',
            'view activity logs',
            'manage notifications',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $superAdmin = Role::firstOrCreate(['name' => 'super_admin']);
        $departmentManager = Role::firstOrCreate(['name' => 'department_manager']);
        $employee = Role::firstOrCreate(['name' => 'employee']);
        $doctor = Role::firstOrCreate(['name' => 'doctor']);
        $student = Role::firstOrCreate(['name' => 'student']);

        $superAdmin->syncPermissions(Permission::all());

        // Department managers and employees receive their effective permissions
        // dynamically from Department::defaultPermissions() through employee syncing.
        $departmentManager->syncPermissions([]);
        $employee->syncPermissions([]);
        $doctor->syncPermissions([]);
        $student->syncPermissions([]);
    }
}