<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            [
                'name' => 'شؤون الطلاب',
                'code' => 'student_affairs',
                'description' => 'قسم إدارة شؤون طلاب المرحلة الجامعية',
            ],
            [
                'name' => 'الامتحانات',
                'code' => 'exams',
                'description' => 'قسم إدارة العلامات والاعتراضات والبرامج الامتحانية',
            ],
            [
                'name' => 'المالية',
                'code' => 'finance',
                'description' => 'قسم الأقساط والمدفوعات السنوية',
            ],
            [
                'name' => 'الدراسات العليا',
                'code' => 'postgraduate',
                'description' => 'قسم إدارة شؤون الماجستير والدكتوراه',
            ],
        ];

        foreach ($departments as $department) {
            Department::updateOrCreate(
                ['code' => $department['code']],
                $department
            );
        }
    }
}